import type { BankTransactionRow, NewBankTransactionInput } from './types';

/**
 * TODO: 後端目前僅有銀行帳戶本身的清單/建立/更新 API（/ael/bankAccounts），尚無「銀行帳戶進出帳交易」
 * 的清單／新增端點。此檔案以記憶體暫存資料模擬清單與新增（重新整理頁面即重置，屬前端暫存資料的已知限制），
 * 日後後端提供對應 API 後，改寫 listBankTransactions／createBankTransaction 內部實作為呼叫真實端點即可，
 * 呼叫端（BankAccountsView）介面維持不變。
 */

let idSeq = 0;
function nextId(): string {
  idSeq += 1;
  return `BTX-${idSeq}`;
}

function toYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

const DEPOSIT_SUMMARIES = ['貨款收入', '利息收入', 'ATM 存款'];
const EXPENSE_SUMMARIES = ['廠商付款', '銀行手續費', '薪資撥款', '轉帳支出', '租金支出'];

/** 產生近 90 天、每 4 天一筆的假交易（不含餘額，餘額由 recalcBalances 統一計算） */
function generateSeedRows(bankAccountUuid: string): Omit<BankTransactionRow, 'balance'>[] {
  const today = new Date();
  const rows: Omit<BankTransactionRow, 'balance'>[] = [];
  for (let i = 90; i >= 0; i -= 4) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const ymd = toYmd(date);
    // 每 8 天出現一筆存入，其餘為支出，模擬帳戶進出頻率；摘要依收支方向各自挑選，避免文字與方向矛盾（如「貨款收入」卻是支出）
    const isDeposit = i % 8 === 0;
    const amount = 1500 + ((i * 173) % 8500);
    const summaries = isDeposit ? DEPOSIT_SUMMARIES : EXPENSE_SUMMARIES;
    rows.push({
      id: nextId(),
      bankAccountUuid,
      transactionDate: ymd,
      accountingDate: ymd,
      summary: summaries[Math.floor(i / 4) % summaries.length],
      expense: isDeposit ? null : amount,
      deposit: isDeposit ? amount : null,
      remark: '',
    });
  }
  return rows;
}

/**
 * 依交易時間排序後逐筆累加，回傳含正確累計餘額的新陣列；startingBalance 為排序後第一筆交易前的餘額。
 * 查詢與新增皆呼叫此函式統一計算，確保「餘額」欄位永遠反映全期交易（不受畫面上的期間篩選影響）。
 */
export function recalcBalances(rows: Omit<BankTransactionRow, 'balance'>[], startingBalance: number): BankTransactionRow[] {
  const sorted = [...rows].sort((a, b) =>
    a.transactionDate === b.transactionDate ? a.id.localeCompare(b.id) : a.transactionDate.localeCompare(b.transactionDate),
  );
  let running = startingBalance;
  return sorted.map(row => {
    running += (row.deposit ?? 0) - (row.expense ?? 0);
    return { ...row, balance: running };
  });
}

interface AccountLedger {
  /** 排序後第一筆交易之前的餘額，回推自 currentBalance 減去假資料淨額，讓假資料最終餘額對齊帳戶真實餘額 */
  startingBalance: number;
  rows: Omit<BankTransactionRow, 'balance'>[];
}

const ledgers: Record<string, AccountLedger> = {};

function ensureLedger(bankAccountUuid: string, currentBalance: number): AccountLedger {
  if (!ledgers[bankAccountUuid]) {
    const rawRows = generateSeedRows(bankAccountUuid);
    const net = rawRows.reduce((sum, r) => sum + (r.deposit ?? 0) - (r.expense ?? 0), 0);
    ledgers[bankAccountUuid] = { startingBalance: currentBalance - net, rows: rawRows };
  }
  return ledgers[bankAccountUuid];
}

/** TODO: 待後端提供銀行帳戶交易清單 API 後，改為呼叫該端點並移除本機暫存邏輯 */
export function listBankTransactions(bankAccountUuid: string, currentBalance: number): Promise<BankTransactionRow[]> {
  const ledger = ensureLedger(bankAccountUuid, currentBalance);
  return Promise.resolve(recalcBalances(ledger.rows, ledger.startingBalance));
}

/** TODO: 待後端提供新增銀行帳戶交易 API 後，改為呼叫該端點 */
export function createBankTransaction(
  bankAccountUuid: string,
  currentBalance: number,
  input: NewBankTransactionInput,
): Promise<BankTransactionRow[]> {
  const ledger = ensureLedger(bankAccountUuid, currentBalance);
  ledger.rows = [...ledger.rows, { ...input, id: nextId() }];
  return Promise.resolve(recalcBalances(ledger.rows, ledger.startingBalance));
}
