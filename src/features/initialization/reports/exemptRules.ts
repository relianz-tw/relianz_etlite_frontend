/**
 * 表四（關係人負債、關係人交易揭露）的「免填」勾選規則：勾了免填，它底下歸屬的問答區塊收起來。
 * key 是勾選欄位的 fieldCode，值是要收起的區塊（sectionCode）。
 * 勾選文字本身用粗體（紙本印的是粗體敘述句），一、二兩大塊之間畫分隔線。
 */
export const EXEMPT_COLLAPSE: Record<string, string[]> = {
  /** 本營利事業無直接或間接對關係人之負債，免填下列一 */
  REL_NO_LIABILITY: ['RELATED_1'],
  /** 本營利事業無關係人及關係人交易，免填下列二、三 */
  REL_NO_RELATED_PARTY: ['RELATED_2', 'RELATED_3'],
};

/** 免填勾選文字粗體 */
export const BOLD_CHECK_KEYS = Object.keys(EXEMPT_COLLAPSE);

/** 這些子區塊上方畫分隔線（「一」與「二」兩大塊之間，從「無關係人及關係人交易」勾選開始算二的那一塊） */
export const DIVIDER_BEFORE_SECTIONS = ['RELATED_NO_PARTY'];

/**
 * 整份可免填的勾選（如未分配盈餘申報書）：勾起來時，除了勾選所在區塊與表頭，其餘區塊全部收起。
 * 畫面與 confirm 送出共用，收起來的區塊不送。
 */
export const EXEMPT_FLAG_KEYS = ['UE_EXEMPT'];

/** 整份免填時仍保留（畫面與送出）的表頭區塊 */
export const EXEMPT_KEEP_SECTION = 'HEADER';
