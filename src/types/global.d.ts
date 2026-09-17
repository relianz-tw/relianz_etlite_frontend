// 全域類型定義檔案
// onboarding 流程綁卡（Step8Checkout）動態載入 jQuery 與綠界 ECPay SDK，
// 兩者皆為外部腳本掛在 window 上的全域變數，無官方型別套件，故於此手動宣告。

declare global {
  var ECPay: any; // ECPay SDK 全域變數
  var $: any; // jQuery 全域變數
  interface Window {
    $: any;
    jQuery: any;
    ECPay: any;
  }
}

// 這個檔案必須是一個模組，所以需要至少一個 export
export {};
