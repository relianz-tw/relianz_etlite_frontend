/**
 * 帳簿區 API 共用設定。
 * 目前專案尚無登入機制，companyUuid 暫由環境變數帶入；待日後串接登入後再改為由使用者 session 取得。
 */
export const COMPANY_UUID = process.env.NEXT_PUBLIC_COMPANY_UUID ?? '';
