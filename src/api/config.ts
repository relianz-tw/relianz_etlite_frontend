/**
 * 帳簿區 API 共用設定。
 * 目前專案尚無登入機制，companyUuid 暫由環境變數帶入；待日後串接登入後再改為由使用者 session 取得。
 */

const DEMO_MODE_STORAGE_KEY = 'easytax-demo-mode';

// 是否有設定 demo 公司 uuid，決定側欄要不要顯示切換入口；未設定時整組 demo 功能視同不存在
export const isDemoModeAvailable = Boolean(process.env.NEXT_PUBLIC_DEMO_COMPANY_UUID);

// 頁面載入當下是否處於 demo 模式；切換模式一律搭配整頁 reload，故此處只需在模組載入時讀一次
export const isDemoMode =
  isDemoModeAvailable &&
  typeof window !== 'undefined' &&
  window.localStorage.getItem(DEMO_MODE_STORAGE_KEY) === 'true';

export const COMPANY_UUID = isDemoMode
  ? (process.env.NEXT_PUBLIC_DEMO_COMPANY_UUID as string)
  : process.env.NEXT_PUBLIC_COMPANY_UUID ?? '';

/** 切換 demo/正式模式並整頁重新整理，讓 COMPANY_UUID 依新狀態重新求值 */
export const setDemoMode = (active: boolean) => {
  if (active) {
    window.localStorage.setItem(DEMO_MODE_STORAGE_KEY, 'true');
  } else {
    window.localStorage.removeItem(DEMO_MODE_STORAGE_KEY);
  }
  window.location.reload();
};
