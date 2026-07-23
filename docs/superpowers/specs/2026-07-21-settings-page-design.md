# 設定頁面（Settings）設計 Spec

日期：2026-07-21

## 背景與目標

`/settings` 連結已存在於 `src/data/navLinks.ts` 的導覽選單中，但對應頁面尚未建立（目前造訪為 404）。
本次要新增設定頁面，包含 6 個既有分頁的視覺模擬畫面（依據使用者提供的截圖），以及新增一個
「收款設定」分頁，將銀行帳戶管理與帳簿既有的「新增銷售管道暨收款方式」功能整合進來。

## 範圍與互動深度

- **基本設定 / 標籤與專案 / 發票簿 / 方案細節 / 帳單 / 營業狀態紀錄**：純視覺模擬。頁籤可切換、
  卡片上的編輯／刪除／新增按鈕會顯示，但點擊不做任何實際邏輯（no-op 或省略 onClick）。內容資料
  皆為假資料，文字內容不需對應真實業務語意。
- **收款設定**（新分類，第 7 個頁籤）：唯一具備真實本地互動邏輯的分頁。

## 路由與檔案結構

```
src/app/settings/page.tsx          # 比照 src/app/ledger/page.tsx 模式，渲染 <SettingsView />

src/features/settings/
  SettingsView.tsx                 # 頁籤導覽（沿用 SegmentedControl，7 個選項）+ 依選取分頁渲染對應元件
  types.ts                         # SettingsTab 等型別
  data.ts                          # 各分頁假資料、BankAccountRecord、BANK_CODE_OPTIONS
  components/
    BasicInfoTab.tsx               # 基本設定
    TagsProjectsTab.tsx            # 標籤與專案
    InvoiceBookTab.tsx             # 發票簿
    PlanDetailTab.tsx              # 方案細節
    BillingTab.tsx                 # 帳單
    OperatingStatusTab.tsx         # 營業狀態紀錄
    PaymentSettingsTab.tsx         # 收款設定：組合 BankAccountCard 列表 + 銷售管道區塊
    BankAccountCard.tsx            # 單一銀行帳戶卡片（檢視/編輯狀態切換）
```

`AddChannelDialog` 維持放在 `src/features/ledger/components/`，`PaymentSettingsTab.tsx` 直接跨
feature import 使用，不搬移檔案（維持改動最小，避免過早抽象共用層）。

## 各分頁內容對應

### 基本設定
- 「基本資料」卡片：兩欄式 label + 唯讀欄位（沿用 `TextInput`/`Select` 的 `disabled` 樣式），
  欄位含組織型態、統一編號、稅籍編號、登記名稱、負責人姓名、健保投保單位代號、郵遞區號、
  登記地址、職災費率類別
- 卡片右上角「編輯基本資料」（`Pencil` icon）與「變更密碼」（`KeyRound` icon）為藍色連結樣式文字，
  純視覺、無 onClick 邏輯
- 「聯絡資訊」子區塊：聯絡人全名、聯絡人電話、電子郵件信箱

### 標籤與專案
- 「專案管理」卡片列表：`@` 前綴 + 專案名稱、狀態 Badge（`已完成`，tone success/muted）、
  開始/結束日期，右上角「+ 新增專案」按鈕
- 「標籤管理」卡片列表：`#` 前綴 + 標籤名稱，卡片右上角「+ 新增標籤」按鈕
- 卡片沿用 `bg-surface-cream` 暖色系底色呼應友善棕重音

### 發票簿
- 期別選擇器（假資料，用 disabled 外觀或純顯示文字即可，不需要真的可切換月份）
- 「手開發票簿」卡片列表：字軌、起號、編輯/刪除 icon
- 「電子發票」卡片：空狀態文字「目前沒有發票本」+「列印格式設定」按鈕

### 方案細節
- 左側「購買服務內容」卡片：憑證數量（disabled Select 外觀）、服務項目 checklist
  （藍色圓形打勾圖示，用 `CircleCheck`／`Check` from lucide-react）、金額與下次扣款日期
- 右側「付款方式」卡片：卡片內顯示信用卡末四碼與到期日、「變更付款信用卡」按鈕
  （`CreditCard` icon + outline 樣式）。信用卡品牌以文字色塊呈現（非圖片/SVG），
  沿用既有 token 底色，不新增自訂色碼

### 帳單
- 依年份分組（假資料僅 2025 一組），月份卡片內顯示交易內容金額、月繳項目明細、
  付款紀錄（Badge：成功，tone success/solid）、交易編號與金額

### 營業狀態紀錄
- 標題右側「目前狀態：復業」Badge（tone info/solid）
- 右上角「新增停業紀錄」按鈕
- 時間軸列表（開業/停業/復業各自的色點 + 垂直線 + Badge + 日期區間 + 修正/刪除連結），
  時間軸樣式為本分頁專屬，不獨立成共用元件（YAGNI，僅此處使用）

### 收款設定（新分類）

**銀行帳戶管理**
- 資料模型 `BankAccountRecord { id, nickname, bankCode, bankName, accountNumber, balance, updatedDate }`
- 只 seed 1 筆假資料，沿用帳簿既有的中國信託港墅分行資料，維持全站假資料一致
- 卡片檢視狀態：唯讀欄位 + 「編輯」「移除」按鈕
- 點擊「編輯」：帳戶暱名／銀行代碼／銀行帳號 變為可編輯（本地 state），存款餘額欄位維持唯讀
  （備註文字：存款餘額依實際交易自動調整）；編輯中的「編輯」按鈕呈 active 藍色樣式
- 「移除」：從本地列表移除該筆（真實移除本地 state，非 no-op）
- 「+ 再加一個銀行帳戶」：底部展開新增表單（帳戶暱名／銀行代碼／銀行帳號／存款餘額皆可輸入，
  存款餘額備註「僅限於首次設定時使用，系統將不再詢問」），「取消」收起表單，「儲存」將新帳戶
  加入本地列表
- 銀行代碼下拉選單（`BANK_CODE_OPTIONS`）僅列常見十餘家銀行（中國信託、國泰世華、台灣銀行、
  第一銀行、華南銀行、上海商業儲蓄銀行、台北富邦、兆豐國際商業銀行、台灣中小企業銀行、
  中華郵政、永豐商業銀行、玉山商業銀行、台新國際商業銀行），非官方完整清單。程式內以註解
  保留手繪稿的提醒（完整清單需另外對照 FISC 銀行代號清單），不會嘗試下載或捏造完整清單

**銷售管道暨收款方式**
- 顯示現有管道列表（沿用 `SALES_CHANNELS` 假資料：現金、匯票、國泰信用卡、MoMo），純顯示不可刪除
- 「+ 新增銷售管道」按鈕開啟既有 `AddChannelDialog`（原封不動重用，`onSubmit` 將新管道加入
  本地顯示列表）

## 設計系統擴充：Badge 元件

`src/components/ui/` 目前沒有狀態徽章元件，新增 `Badge.tsx`：

```
tone: 'success' | 'error' | 'info' | 'neutral'
variant?: 'solid' | 'muted'  // 預設 muted

solid  → success: bg-semantic-success text-white
         error:   bg-semantic-error text-white
         info:    bg-brand-blue text-white
         neutral: bg-neutral-mid text-white
muted  → success: bg-semantic-success-muted text-semantic-success-dark
         error:   bg-semantic-error/10 text-semantic-error
         info:    bg-brand-blue/10 text-brand-blue
         neutral: bg-surface-cream text-neutral-mid
```

顏色語意對應（以 `DESIGN.md` 既有的「成功/正面→裁切綠」規則為準，非照手繪稿貌似的藍色）：
- 已完成 → success / muted
- 帳單「成功」 → success / solid
- 開業 → success / solid
- 停業 → error / solid
- 復業、目前狀態 → info / solid

實作前會在 `DESIGN.md` 的「4. Component Stylings」新增一小節「Status Badge」記錄上述規格，
確保之後其他頁面若需要徽章可直接沿用，不再各自發揮樣式。

## 響應式／手機版

沿用專案既有慣例：唯一斷點為 `tailwind.config.js` 的 `nav: 1000px`（帳簿頁面 `LedgerTable`／
`LedgerCards` 已用此斷點做桌面表格／手機卡片的雙版型切換）。

- **分頁導覽（7 個頁籤）**：7 個中文標籤在窄螢幕以等寬 grid 呈現會過度擁擠，故比照帳簿雙版型模式：
  - 桌面（`nav:` 以上）：沿用 `SegmentedControl` 一列 7 等分
  - 手機（`nav:` 以下）：改用既有 `Select` 元件做單一下拉選單選擇分頁，`hidden nav:block` /
    `nav:hidden` 各自控制顯示，兩者共用同一個 `activeTab` state
- **基本設定兩欄表單**：`grid-cols-1 nav:grid-cols-2`，手機上欄位改為單欄堆疊
- **方案細節左右兩卡片（購買服務內容／付款方式）**：`flex-col nav:flex-row`，手機上垂直堆疊
- **銀行帳戶卡片欄位**：本來就是單欄 label + 輸入框堆疊，手機/桌面皆適用，不需額外調整
- **卡片內按鈕列**（編輯/移除、修正/刪除等）：手機寬度不足時允許換行（`flex-wrap`），避免溢出捲動
- 所有卡片維持單欄可滑動堆疊，不新增額外的手機專屬元件，僅靠既有 `nav:` 斷點的 Tailwind
  responsive class 調整版面

## 不在範圍內

- 6 個模擬分頁的表單不做任何送出/驗證邏輯、不接後端
- 銀行代碼清單不追求官方完整性
- 不修改 Navbar（`/settings` 連結已存在）
- 不動既有帳簿 `AddChannelDialog` 的內部邏輯
