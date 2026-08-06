import type { BankTransactionRow, LinkedLedgerTxn, NewBankTransactionInput } from './types';

/**
 * TODO: 後端目前僅有銀行帳戶本身的清單/建立/更新 API（/ael/bankAccounts），尚無「銀行帳戶進出帳交易」
 * 的清單／新增端點，也尚無「銀行交易與帳簿交易關聯」的端點。此檔案以記憶體暫存資料模擬清單、新增與關聯
 * （重新整理頁面即重置，屬前端暫存資料的已知限制），日後後端提供對應 API 後，改寫
 * listBankTransactions／createBankTransaction／getBankTransaction 內部實作為呼叫真實端點即可，
 * 呼叫端（BankAccountsView／BankTransactionDetailView）介面維持不變。
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

/** 銀行內部作業（利息入帳／手續費／臨櫃存款）無外部轉入轉出對象，其餘摘要視為轉帳類，補上對方帳戶資訊 */
const NO_COUNTERPARTY_SUMMARIES = new Set(['銀行手續費', 'ATM 存款', '利息收入']);

const SALES_COUNTERPARTIES = ['大有貿易有限公司', '正興五金行', '匯豐科技股份有限公司'];
const PURCHASE_COUNTERPARTIES = ['台灣電力公司', '順豐物流股份有限公司', '永豐辦公用品行'];
const SALES_ITEMS = ['商品銷售', '服務收入', '設備租賃收入'];
const PURCHASE_ITEMS = ['辦公用品採購', '水電費', '原物料採購'];
/** 與 PURCHASE_ITEMS 依索引對應的費用類別；比照帳簿表格僅進項交易顯示費用類別欄位 */
const PURCHASE_CATEGORIES = ['文具用品', '水電瓦斯', '原物料'];
/** 專案名稱假資料池，含空字串模擬未歸屬專案的交易（顯示為「—」） */
const BANK_PROJECT_NAMES = ['台北旗艦店擴建', '年度品牌重塑', ''];

const DEPOSIT_CHANNELS = ['跨行匯款', '網路銀行', 'ATM 存款'];
const EXPENSE_CHANNELS = ['網路銀行轉帳', '自動扣款', '临柜辦理', 'ATM 轉帳'];
const TELLERS = ['王小明', '李小華', '陳雅婷'];
const COUNTERPARTY_BANKS = ['兆豐國際商業銀行', '國泰世華商業銀行', '台北富邦商業銀行', '玉山商業銀行'];

function pickChannel(i: number, isDeposit: boolean): string {
  const pool = isDeposit ? DEPOSIT_CHANNELS : EXPENSE_CHANNELS;
  return pool[Math.floor(i / 4) % pool.length];
}

/** 临柜辦理需經辦人員親自處理；其餘管道視為系統自動處理 */
function resolveHandler(channel: string, i: number): string {
  return channel === '临柜辦理' ? TELLERS[Math.floor(i / 12) % TELLERS.length] : '系統自動';
}

function pseudoAccountNo(seed: number): string {
  return String(800000000000 + seed * 913).slice(0, 12);
}

let refSeq = 0;
/** 銀行流水編號，格式比照銀行對帳單常見的 REF-<日期>-<序號> */
function nextReferenceNo(ymd: string): string {
  refSeq += 1;
  return `REF-${ymd}-${String(refSeq).padStart(4, '0')}`;
}

let ledgerSeq = 0;
/** 發票號碼：兩碼字軌＋8 碼流水號，格式比照帳簿交易表單的發票號碼欄位 */
function nextInvoiceNo(seq: number): string {
  const letter1 = String.fromCharCode(65 + (seq % 26));
  const letter2 = String.fromCharCode(65 + ((seq * 7) % 26));
  const digits = String(10000000 + seq * 137).slice(-8);
  return `${letter1}${letter2}${digits}`;
}

/** 帳簿交易編號：比照帳簿表格「交易編號」欄位格式（如 UA40435900），與發票號碼是不同欄位/概念 */
function nextLedgerTxnId(seq: number): string {
  return `UA${40430000 + seq}`;
}

function buildLinkedTxn(
  side: 'sales' | 'purchase',
  counterparty: string,
  itemSummary: string,
  amount: number,
  date: string,
  category?: string,
): LinkedLedgerTxn {
  ledgerSeq += 1;
  return {
    id: nextLedgerTxnId(ledgerSeq),
    uuid: `MOCK-${side.toUpperCase()}-${ledgerSeq}`,
    side,
    counterparty,
    amount,
    date,
    invoiceNo: nextInvoiceNo(ledgerSeq),
    itemSummary,
    // 專案名稱僅進項交易顯示，比照帳簿表格；銷項不帶 category/project
    ...(category ? { category, project: BANK_PROJECT_NAMES[ledgerSeq % BANK_PROJECT_NAMES.length] } : {}),
  };
}

/** 依 referenceNo 產生一組偽條碼寬度，讓每張憑證的條碼看起來略有不同 */
function buildBarcodeBars(referenceNo: string): string {
  let x = 48;
  let bars = '';
  for (let c = 0; c < referenceNo.length; c += 1) {
    const width = 2 + (referenceNo.charCodeAt(c) % 4);
    bars += `<rect x="${x}" y="0" width="${width}" height="40" fill="#3A3830"/>`;
    x += width + 3;
  }
  return bars;
}

/**
 * 產生憑證照片的假資料（data URI 形式的 SVG，不依賴外部圖檔／網路請求，見檔首 TODO）：
 * 模擬存摺/轉帳憑條版面，包含摘要、金額、日期、交易管道、交易序號與偽條碼，供交易明細頁預覽。
 */
function buildVoucherImage(params: { summary: string; amount: number; ymd: string; referenceNo: string; channel: string; isDeposit: boolean }): string {
  const { summary, amount, ymd, referenceNo, channel, isDeposit } = params;
  const displayDate = `${ymd.slice(0, 4)}/${ymd.slice(4, 6)}/${ymd.slice(6, 8)}`;
  const amountText = `$${amount.toLocaleString('en-US')}`;
  const accentColor = isDeposit ? '#377456' : '#DD6B5F';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="640" viewBox="0 0 480 640">
    <rect width="480" height="640" fill="#F5F3F2"/>
    <rect x="24" y="24" width="432" height="592" rx="12" fill="#FFFFFF" stroke="#9AA7B9" stroke-width="1.5"/>
    <text x="240" y="72" text-anchor="middle" font-family="sans-serif" font-size="20" font-weight="700" fill="#3A3830">銀行交易憑證</text>
    <line x1="48" y1="96" x2="432" y2="96" stroke="#9AA7B9" stroke-width="1" stroke-dasharray="4 4"/>
    <text x="48" y="138" font-family="sans-serif" font-size="13" fill="#797C80">摘要</text>
    <text x="48" y="164" font-family="sans-serif" font-size="19" font-weight="600" fill="#3A3830">${summary}</text>
    <text x="48" y="206" font-family="sans-serif" font-size="13" fill="#797C80">金額</text>
    <text x="48" y="238" font-family="monospace" font-size="27" font-weight="700" fill="${accentColor}">${amountText}</text>
    <line x1="48" y1="264" x2="432" y2="264" stroke="#9AA7B9" stroke-width="1" stroke-dasharray="4 4"/>
    <text x="48" y="300" font-family="sans-serif" font-size="12" fill="#797C80">交易日期</text>
    <text x="200" y="300" font-family="monospace" font-size="12" fill="#3A3830">${displayDate}</text>
    <text x="48" y="328" font-family="sans-serif" font-size="12" fill="#797C80">交易管道</text>
    <text x="200" y="328" font-family="sans-serif" font-size="12" fill="#3A3830">${channel}</text>
    <text x="48" y="356" font-family="sans-serif" font-size="12" fill="#797C80">交易序號</text>
    <text x="200" y="356" font-family="monospace" font-size="12" fill="#3A3830">${referenceNo}</text>
    <line x1="48" y1="382" x2="432" y2="382" stroke="#9AA7B9" stroke-width="1" stroke-dasharray="4 4"/>
    <g transform="translate(0, 480)">${buildBarcodeBars(referenceNo)}</g>
    <text x="240" y="548" text-anchor="middle" font-family="monospace" font-size="11" letter-spacing="2" fill="#797C80">${referenceNo}</text>
    <text x="240" y="600" text-anchor="middle" font-family="sans-serif" font-size="11" fill="#9AA7B9">此憑證僅供對帳用途，非正式收據</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * 依交易方向模擬 1～2 筆關聯帳簿交易（前端假關聯，見檔首 TODO）：金額依交易金額切分。
 * 每筆銀行交易固定至少 1 筆關聯，方便直接看到假資料；i % 24 === 14 時產生 2 筆增加變化
 * （i 恆為 4 的倍數加 2，用 24 取餘數才能保持與 i 同為 ≡2 mod 4，見先前註記的隱性 bug）。
 */
function generateLinkedTransactions(i: number, isDeposit: boolean, amount: number, ymd: string): LinkedLedgerTxn[] {
  const side = isDeposit ? 'sales' : 'purchase';
  const counterparties = isDeposit ? SALES_COUNTERPARTIES : PURCHASE_COUNTERPARTIES;
  const items = isDeposit ? SALES_ITEMS : PURCHASE_ITEMS;
  const categories = isDeposit ? undefined : PURCHASE_CATEGORIES;
  const linkedCount = i % 24 === 14 ? 2 : 1;
  if (linkedCount === 1) {
    return [buildLinkedTxn(side, counterparties[0], items[0], amount, ymd, categories?.[0])];
  }
  const firstAmount = Math.round(amount * 0.6);
  return [
    buildLinkedTxn(side, counterparties[0], items[0], firstAmount, ymd, categories?.[0]),
    buildLinkedTxn(side, counterparties[1], items[1], amount - firstAmount, ymd, categories?.[1]),
  ];
}

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
    const summary = summaries[Math.floor(i / 4) % summaries.length];
    const channel = pickChannel(i, isDeposit);
    const referenceNo = nextReferenceNo(ymd);
    // 少數交易刻意不附憑證，用以呈現詳細頁「尚無憑證照片」的空狀態；i 恆為 4 的倍數加 2（迴圈以 4 遞減、90 % 4 = 2），
    // 故取 i % 40 === 2（即每 10 筆 1 筆）而非 % 20，否則因 20 為 4 的倍數會恆不成立、永遠不會命中空狀態
    const hasVoucher = i % 40 !== 2;
    rows.push({
      id: nextId(),
      bankAccountUuid,
      transactionDate: ymd,
      accountingDate: ymd,
      summary,
      expense: isDeposit ? null : amount,
      deposit: isDeposit ? amount : null,
      remark: '',
      linkedTransactions: generateLinkedTransactions(i, isDeposit, amount, ymd),
      referenceNo,
      channel,
      handler: resolveHandler(channel, i),
      voucherImage: hasVoucher ? buildVoucherImage({ summary, amount, ymd, referenceNo, channel, isDeposit }) : null,
      ...(NO_COUNTERPARTY_SUMMARIES.has(summary)
        ? {}
        : { counterpartyBank: COUNTERPARTY_BANKS[Math.floor(i / 4) % COUNTERPARTY_BANKS.length], counterpartyAccount: pseudoAccountNo(i) }),
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
  ledger.rows = [...ledger.rows, { ...input, id: nextId(), referenceNo: nextReferenceNo(input.transactionDate) }];
  return Promise.resolve(recalcBalances(ledger.rows, ledger.startingBalance));
}

/** TODO: 待後端提供銀行交易單筆查詢／關聯帳簿交易 API 後，改為呼叫該端點；查無此筆時回傳 null */
export function getBankTransaction(bankAccountUuid: string, currentBalance: number, id: string): Promise<BankTransactionRow | null> {
  const ledger = ensureLedger(bankAccountUuid, currentBalance);
  const row = recalcBalances(ledger.rows, ledger.startingBalance).find(r => r.id === id);
  return Promise.resolve(row ?? null);
}
