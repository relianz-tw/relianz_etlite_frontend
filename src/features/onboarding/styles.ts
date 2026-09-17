/**
 * Onboarding 頁面共用樣式常數
 * 集中管理結構化 className，色彩一律使用 tailwind.config.js 語意 token，禁止直接寫色碼
 */

// ---- 版型 ----

/** 左側品牌面板（所有步驟共用基礎）；依步驟於外部追加 gap-X */
export const leftPanel =
  'order-2 md:order-1 w-full md:w-2/5 bg-semantic-success text-white flex flex-col flex-1 md:flex-none px-8 pt-8 pb-24 md:p-12 md:overflow-y-auto';

/**
 * 左側品牌面板（手機版置頂變體）
 * 適用於宣傳/介紹/空白（未來放圖）的步驟，手機版排在上方
 * 差異：移除 order-2 / flex-1 / pb-24，使用自然 DOM 順序（綠色優先顯示）
 */
export const leftPanelMobileTop =
  'md:order-1 w-full md:w-2/5 bg-surface-off-white text-neutral-dark flex flex-col md:flex-none p-8 md:p-12 md:overflow-y-auto';

/** 左側佔位圖（待換為實際圖片） */
export const imgPlaceholder =
  'w-full aspect-[4/3] rounded-lg bg-semantic-success-dark';

// ---- 按鈕 ----

/** 右欄主要行動按鈕（全寬） */
export const btnPrimary =
  'w-full rounded bg-brand-blue text-white py-3 font-medium text-sm hover:bg-brand-blue-dark transition-colors';

/** 右欄主要行動按鈕（全寬，含 disabled 樣式） */
export const btnPrimaryDisableable = `${btnPrimary} disabled:opacity-40 disabled:cursor-not-allowed`;

/** 左側面板下載按鈕（白色反白風格） */
export const btnDownload =
  'rounded bg-semantic-success border border-white/50 text-white text-xs px-3 py-1 hover:bg-white/20';

/** 左側面板上一頁按鈕（手機版隱藏，改由 OnboardingHeader 顯示） */
export const btnBack =
  'hidden md:flex items-center gap-1 text-sm text-white hover:text-white/80 transition-colors';

/** 文字型次要操作（如：重新試算、跳過） */
export const btnTextLink =
  'text-sm text-neutral-dark/50 underline underline-offset-2 text-center hover:text-neutral-dark';

// ---- 選項切換按鈕（銷售模式、計費週期等） ----

/** 已選中 */
export const optionSelected = 'bg-brand-blue border-brand-blue text-white';

/** 未選中 */
export const optionUnselected =
  'bg-white border-neutral-blue-gray/50 text-neutral-dark hover:border-brand-blue';
