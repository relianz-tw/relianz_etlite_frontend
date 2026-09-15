# 銀行帳戶總覽交易展開 API 設計 Spec

日期：2026-09-15

## 背景與目標

銀行帳戶總覽（`/bank-accounts`）交易列表點一列會 inline 展開「關聯帳簿交易」清單，另有交易明細頁
`/bank-accounts/[settleEventUuid]`。兩者目前都已串接真實 API（無假資料），但都是用既有端點湊出來的，
有三個問題需要後端補規格：

1. **展開列 N+1**：`POST /ael/bankAccounts/transactions` 只回沖帳事件本身，不含關聯原單明細。
   前端展開一列時，對該筆的 `originLedgerUuids` 逐一呼叫 `GET /ael/ledger/entries/detail`；
   匯總沖帳一筆可能關聯 10+ 張原單，等於展開一次打 10+ 支請求。
2. **無後端分頁、前端自行加總**：為了算「本期存入／支出合計」，前端目前先抓 100 筆探出 `total`，
   不足時再用 `limit=total` 把整個查詢期間的資料一次撈回來，前端自行 slice 分頁、reduce 加總。
   期間拉長時單次回應會變得很大，且合計未來若要排除特定情境（如已恢復交易）前後端容易對不齊。
3. **明細頁沒有單筆查詢端點**：目前是重新查一次整個期間的列表，再用 `settleEventUuid` 在前端
   `find()`。直接分享網址或重新整理頁面時，若沒有期間資訊可用，會查不到該筆交易。

## 二、已確認可参考的既有結構

`GET /ael/ledger/settle/event/list`（對帳中心用）的回應中，每筆事件已經帶有 `details[]`，
欄位涵蓋 `ledgerUuid / voucherDate / voucherNumber / counterpartyLabel / counterpartyName /
amount / originAmount / balanceBefore / balanceAfter`，形狀與本次展開列需要的資訊高度重疊。
本次規格沿用同一組欄位命名，僅依銀行帳戶頁的實際需求增減，避免前端再自創一套語意。

該端點是依 `side` + 期間查詢（非 `bankAccountUuid`），無法直接套用在銀行帳戶頁，故仍需在
`/ael/bankAccounts/transactions` 這條既有端點上擴充。

---

## 三、規格 A：`POST /ael/bankAccounts/transactions` 擴充

現有端點，僅擴充回應內容與補上真實分頁行為，**Request 參數不變**：

```json
{
  "companyUuid": "string",
  "bankAccountUuid": "string",
  "dateFrom": "YYYYMMDD",
  "dateTo": "YYYYMMDD",
  "limit": 10,
  "page": 1
}
```

要求：`limit`／`page` 需真的用於查詢切頁，不再是「回全量交由前端分頁」。

### Response `data` 異動

**(1) 新增 `summary`（與 `items` 同級，反映整個查詢期間，不受 `limit`/`page` 影響）**

| 欄位 | 型別 | 說明 |
|---|---|---|
| `summary.depositTotal` | integer | 期間內存入合計（`cashDirection = 0`），**排除 `isReverse = true`** 的事件 |
| `summary.expenseTotal` | integer | 期間內支出合計（`cashDirection = 1`），**排除 `isReverse = true`** 的事件 |

**(2) 每筆 `items[]` 新增 `details[]`**（與既有 `originLedgerUuids` 同序，逐筆對應該筆沖帳事件關聯的原單）：

| 欄位 | 型別 | 說明 |
|---|---|---|
| `ledgerUuid` | string | 原單交易 uuid |
| `orderCode` | string | 交易編號 |
| `entryType` | integer | 0 進項／1 進折／2 銷項／3 銷折 |
| `counterpartyName` | string | 交易對象名稱 |
| `officialAccountingSubjectId` | integer | 科目 id |
| `subjectName` | string | 科目名稱（避免前端另外呼叫科目清單反查） |
| `transactionDate` | string | 交易發生日 YYYYMMDD |
| `voucherNumber` | string | 發票字軌＋號碼；無票為空字串 |
| `originAmount` | integer | 原單金額 |
| `amount` | integer | 該原單**本次**沖帳事件的沖帳金額（非原單累計已沖金額） |
| `balanceBefore` | integer | 該原單沖銷前剩餘金額 |
| `balanceAfter` | integer | 該原單沖銷後剩餘金額 |

> `amount` 需為「這一次事件」對該原單的沖帳金額——同一張原單可能被沖帳多次，不能回傳累計值。

### 完整 Response 範例

```json
{
  "success": true,
  "errorCode": "0000",
  "message": "操作成功",
  "data": {
    "bankAccountUuid": "6a0bc0cc-3fb8-4b2f-a02a-c7af65a25dd2",
    "items": [
      {
        "settleEventUuid": "fbfe7e59-345e-46b9-81eb-5727a0fad06b",
        "reconMethod": 2,
        "side": 0,
        "paymentDate": "20260811",
        "settleAmount": 525,
        "cashAmount": 525,
        "cashDirection": 0,
        "isReverse": false,
        "mainSettlementLedgerUuid": "7da59c26-53fa-4c5f-975a-afe5d17fe58e",
        "originLedgerUuids": ["52d17953-4952-4de4-9322-88f414abd61d"],
        "originOfficialAccountingSubjectIds": [12],
        "primaryOriginLedgerUuid": "52d17953-4952-4de4-9322-88f414abd61d",
        "primaryOfficialAccountingSubjectId": 12,
        "hasInvoice": true,
        "counterpartyName": "某某廠商",
        "paymentChannelName": "",
        "createdAt": "2026-08-11T09:12:00Z",
        "details": [
          {
            "ledgerUuid": "52d17953-4952-4de4-9322-88f414abd61d",
            "orderCode": "P-20260811-0001",
            "entryType": 0,
            "counterpartyName": "某某廠商",
            "officialAccountingSubjectId": 12,
            "subjectName": "應付帳款",
            "transactionDate": "20260810",
            "voucherNumber": "AB12345678",
            "originAmount": 525,
            "amount": 525,
            "balanceBefore": 525,
            "balanceAfter": 0
          }
        ]
      }
    ],
    "total": 42,
    "limit": 10,
    "page": 1,
    "summary": {
      "depositTotal": 12000,
      "expenseTotal": 8600
    }
  }
}
```

---

## 四、規格 B：新增 `GET /ael/bankAccounts/transactions/detail`

供交易明細頁單筆查詢，解決重整/分享網址查不到資料的問題。

### Request

| Query | 必填 | 說明 |
|---|---|---|
| `companyUuid` | ✓ | 公司 uuid |
| `settleEventUuid` | ✓ | 沖帳事件 uuid |

### Response `data`

同規格 A 單筆 `items[]` 的所有欄位（含 `details[]`），額外補三個明細頁需要、目前得靠額外請求拼湊的欄位：

| 欄位 | 型別 | 說明 |
|---|---|---|
| `bankAccountUuid` | string | 所屬銀行帳戶 uuid，讓明細頁不需靠網址 `?account=` 才能還原資料 |
| `invoicePicUrl` | string \| null | `primaryOriginLedgerUuid` 對應原單的憑證圖片網址 |
| `counterpartyName` | string | 交易對象名稱（優先取自 `primaryOriginLedgerUuid` 原單的買方／賣方名稱，取不到則回退沖帳事件本身欄位） |

查無該 `settleEventUuid` 時：`success: false`，`errorCode` 沿用專案既有錯誤碼慣例（信封格式，非 HTTP 4xx 判斷成功與否）。

### Response 範例

```json
{
  "success": true,
  "errorCode": "0000",
  "message": "操作成功",
  "data": {
    "settleEventUuid": "fbfe7e59-345e-46b9-81eb-5727a0fad06b",
    "bankAccountUuid": "6a0bc0cc-3fb8-4b2f-a02a-c7af65a25dd2",
    "reconMethod": 2,
    "side": 0,
    "paymentDate": "20260811",
    "settleAmount": 525,
    "cashAmount": 525,
    "cashDirection": 0,
    "isReverse": false,
    "mainSettlementLedgerUuid": "7da59c26-53fa-4c5f-975a-afe5d17fe58e",
    "originLedgerUuids": ["52d17953-4952-4de4-9322-88f414abd61d"],
    "originOfficialAccountingSubjectIds": [12],
    "primaryOriginLedgerUuid": "52d17953-4952-4de4-9322-88f414abd61d",
    "primaryOfficialAccountingSubjectId": 12,
    "hasInvoice": true,
    "counterpartyName": "某某廠商",
    "paymentChannelName": "",
    "createdAt": "2026-08-11T09:12:00Z",
    "invoicePicUrl": null,
    "details": [
      {
        "ledgerUuid": "52d17953-4952-4de4-9322-88f414abd61d",
        "orderCode": "P-20260811-0001",
        "entryType": 0,
        "counterpartyName": "某某廠商",
        "officialAccountingSubjectId": 12,
        "subjectName": "應付帳款",
        "transactionDate": "20260810",
        "voucherNumber": "AB12345678",
        "originAmount": 525,
        "amount": 525,
        "balanceBefore": 525,
        "balanceAfter": 0
      }
    ]
  }
}
```

> 明細頁的日記帳分錄維持呼叫既有 `GET /ael/ledger/entries/dailyDetail`（帶 `mainSettlementLedgerUuid`），此次不動。

---

## 五、前端配合改動（規格上線後）

- `src/api/types.ts`：`BankSettleEventDto` 加 `details`；`BankTransactionsResult` 加 `summary`；
  新增 `BankSettleEventDetailDto`、`BankTransactionsSummaryDto`、`BankTransactionDetailResult`。
- `src/api/bankAccounts.ts`：新增 `fetchBankTransactionDetail({ settleEventUuid })`。
- `src/features/bank-accounts/data.ts`：`loadBankTransactions` 移除補抓全量與科目清單反查邏輯，
  改讀後端 `summary`；新增 `loadBankTransactionDetail`；刪除 `loadLinkedTransactions`／`mapEntryDetailToLinked`。
- 刪除 `src/features/bank-accounts/useLazyLinkedTransactions.ts`（資料隨列表回應一起送達，不再需要懶載入）。
- `BankAccountsView.tsx`：分頁與合計改吃後端回應；`BankTransactionDetailView.tsx`：改用單筆端點，
  移除「重查列表 + find」與期間 fallback 邏輯。

（前端程式改動待後端規格確認/上線後再進行，本文件僅為交付後端的介面約定。）
