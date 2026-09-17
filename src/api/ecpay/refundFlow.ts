/**
 * 安全退費流程。原 cashflow 版本的 doAction/getCreditDetailServer 是「伺服器端程式碼
 * 卻繞經 HTTP 打自家 route」，這裡直接 import ecpayServer.ts 的函式呼叫，省一次 HTTP 往返。
 */
import { creditDoAction, getCreditDetail } from '@/lib/ecpayServer';
import { isWithinAutoCloseBlackout, retryAsync } from '@/lib/retry';

/** 安全退費流程的執行結果 */
export type RefundResult =
  | {
      /** 退費成功 */
      status: 'refunded';
      action: 'N' | 'R';
      detail?: string;
    }
  | {
      /** 交易狀態無需動作（已取消、操作取消、未授權） */
      status: 'no_action_needed';
      detail?: string;
    }
  | {
      /** 在每日自動關帳時段（20:15~20:30）略過退費，需人工後續處理 */
      status: 'skipped_blackout';
      detail: string;
    }
  | {
      /** 重試 3 次後仍失敗，需人工處理 */
      status: 'failed';
      detail: string;
    };

/** 呼叫 DoAction，以 RtnCode=1 為成功，失敗則拋錯觸發外層重試 */
async function runDoAction(
  merchantTradeNo: string,
  tradeNo: string,
  action: 'N' | 'R' | 'E',
  amount: number
): Promise<RefundResult> {
  const doActionRes = (await creditDoAction({
    MerchantTradeNo: merchantTradeNo,
    TradeNo: tradeNo,
    Action: action,
    TotalAmount: amount,
  })) as { RtnCode?: number } | undefined;
  const rtnCode = doActionRes?.RtnCode;

  if (rtnCode !== 1) {
    throw new Error(
      `DoAction(Action=${action}) 失敗，RtnCode=${rtnCode}，merchantTradeNo=${merchantTradeNo}`
    );
  }

  // E（取消關帳）只是中間步驟，仍須接續 N 才算退費完成，故不視為終態
  return { status: 'refunded', action: action === 'E' ? 'N' : action };
}

/**
 * 安全退費流程（依綠界官方建議）
 *
 * 流程：
 * 1. 關帳時段阻擋（台北時間 20:15~20:30）→ 略過並回傳 skipped_blackout
 * 2. 查詢信用卡單筆明細 → 依狀態決定 Action（狀態值為英文，見 45925.md）
 *    - Authorized（已授權）→ Action=N（放棄授權）
 *    - Captured（已關帳）→ Action=R（退刷）
 *    - To be captured（要關帳）→ 先 Action=E（取消關帳）再 Action=N（放棄）
 *    - Canceled/Unauthorized/Operation canceled → 無需動作
 * 3. 呼叫 DoAction（以 RtnCode=1 為成功）
 * 4. 以上步驟套用最多 3 次重試（每次重試都重新查詢明細）
 */
export async function safeRefundAuthorization(params: {
  merchantTradeNo: string;
  tradeNo: string;
  amount: number;
}): Promise<RefundResult> {
  const { merchantTradeNo, tradeNo, amount } = params;

  // 1. 關帳時段阻擋（台北時間 20:15~20:30）
  if (isWithinAutoCloseBlackout()) {
    const detail = `關帳時段略過，訂單 ${merchantTradeNo} NT$${amount} 需於 20:30 後人工確認退刷`;
    console.error(`[退費略過] ${detail}`);
    return { status: 'skipped_blackout', detail };
  }

  try {
    // 2 & 3. 查詢明細 → 依狀態執行 DoAction，套用最多 3 次重試
    return await retryAsync(
      async (): Promise<RefundResult> => {
        // 每次重試都重新查詢，確保取得最新狀態（符合綠界 FAQ #1/#3）
        const detailRes = (await getCreditDetail({
          MerchantTradeNo: merchantTradeNo,
        })) as { RtnValue?: unknown } | undefined;

        // RtnValue 可能為 JSON 字串（依綠界解密實作而異），需容錯處理
        let rtnValue = detailRes?.RtnValue;
        if (typeof rtnValue === 'string') {
          try {
            rtnValue = JSON.parse(rtnValue);
          } catch {
            // 解析失敗視為查詢異常，觸發重試
            throw new Error(`RtnValue 解析失敗: ${rtnValue}`);
          }
        }

        // 大小寫容錯（文件顯示大寫 Status，但實際回應不保證）
        const rv = rtnValue as { Status?: string; status?: string } | undefined;
        const status: string = rv?.Status ?? rv?.status ?? '';

        // 無需退費的狀態（綠界 CreditDetail/QueryTrade 回傳英文狀態值，見 45925.md）
        if (
          ['Canceled', 'Unauthorized', 'Operation canceled'].includes(status)
        ) {
          return {
            status: 'no_action_needed',
            detail: `交易狀態為「${status}」，無需執行退費`,
          };
        }

        // 已授權（尚未關帳）→ 直接放棄釋放額度
        if (status === 'Authorized') {
          return await runDoAction(merchantTradeNo, tradeNo, 'N', amount);
        }

        // 已完成關帳 → 退刷
        if (status === 'Captured') {
          return await runDoAction(merchantTradeNo, tradeNo, 'R', amount);
        }

        // 要關帳（已授權但尚未執行關帳）→ 全額退款須先取消關帳（E）再放棄（N），見 45919.md
        if (status === 'To be captured') {
          await runDoAction(merchantTradeNo, tradeNo, 'E', amount);
          return await runDoAction(merchantTradeNo, tradeNo, 'N', amount);
        }

        // 未知狀態拋錯，觸發重試以取得最新明細
        throw new Error(
          `未知的交易狀態：${status}，merchantTradeNo=${merchantTradeNo}`
        );
      },
      {
        maxAttempts: 3,
        delayMs: 1000,
        onRetry: (error, attempt) => {
          console.error(
            `[退費重試 ${attempt}/3] merchantTradeNo=${merchantTradeNo}，錯誤：`,
            error
          );
        },
      }
    );
  } catch (error) {
    // 3 次重試後仍失敗
    const detail = `重試 3 次後仍失敗，訂單 ${merchantTradeNo} NT$${amount}，需人工處理。錯誤：${
      error instanceof Error ? error.message : String(error)
    }`;
    console.error(`[退費失敗] ${detail}`);
    return { status: 'failed', detail };
  }
}
