/**
 * Initialization 頁面共用樣式常數
 * 與 features/onboarding/styles.ts 為同一套視覺語言的獨立副本（各 feature 自成模組，避免跨層依賴），
 * 色彩一律使用 tailwind.config.js 語意 token，禁止直接寫色碼
 */

// ---- 按鈕 ----

/** 右欄主要行動按鈕（全寬） */
export const btnPrimary = 'w-full rounded bg-brand-blue text-white py-3 font-medium text-sm hover:bg-brand-blue-dark transition-colors';

/** 右欄主要行動按鈕（全寬，含 disabled 樣式） */
export const btnPrimaryDisableable = `${btnPrimary} disabled:opacity-40 disabled:cursor-not-allowed`;

/** 左側面板上一頁按鈕（手機版隱藏，改由 MobileBackBar 顯示） */
export const btnBack = 'hidden md:flex items-center gap-1 text-sm text-white hover:text-white/80 transition-colors';

/** 文字型次要操作（如：稍後再設定、手動輸入） */
export const btnTextLink = 'text-sm text-neutral-dark/50 underline underline-offset-2 text-center hover:text-neutral-dark';

// ---- 選項切換按鈕 ----

export const optionSelected = 'bg-brand-blue border-brand-blue text-white';
export const optionUnselected = 'bg-white border-neutral-blue-gray/50 text-neutral-dark hover:border-brand-blue';
