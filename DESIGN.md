# Design System — 友信創新 × 友植會計師事務所
> Based on Revolut UI architecture, adapted with Relianz (友信創新) as primary brand and A.M. CPA & Associates (友植會計師事務所) as supplementary.

---

## 1. Visual Theme & Atmosphere

This design system communicates trust, reliability, and professional partnership — a corporate identity built on the Relianz brand ethos: **如朋友友善，如夥伴可靠**. The visual language pairs structured confidence with warmth: traditional serif headlines carry gravitas, while a restrained earth-and-blue palette avoids cold tech sterility.

Typography is anchored by **Baskerville Semibold** for display, paired with **Noto Serif TC** for Chinese headings — a serif-first strategy that reads as authoritative yet approachable. Body copy uses **Baskerville Regular** and **Noto Sans TC**, ensuring clear readability across bilingual content.

The color system centers on Relianz's **城信藍 (`#005FA2`)** as the primary brand driver, complemented by **友善棕 (`#BE9F86`)** as a warm accent. Where Relianz's palette lacks coverage (e.g. success states, muted surfaces), A.M. CPA's greens and neutrals fill in seamlessly.

**Key Characteristics:**
- Baskerville Semibold + Noto Serif TC for all headings — serif authority across EN/ZH
- 城信藍 (`#005FA2`) as primary brand blue; 友善棕 (`#BE9F86`) as warm accent
- Rounded buttons (8px–9999px range) with generous padding
- Flat surfaces: depth through section contrast and whitespace, not shadows
- Tight display line-heights (1.10–1.20) with relaxed body (1.60–1.75) for CJK readability

---

## 2. Color Palette & Roles

### Primary — 友信創新 (Relianz)

| Name | Hex | Role |
|------|-----|------|
| 城信藍 | `#005FA2` | Primary brand, buttons, links, key UI elements |
| 友善棕 | `#BE9F86` | Warm accent, logo secondary, decorative highlights |
| Pure White | `#FFFFFF` | Primary surface, text on dark |
| 清爽白 | `#F5F3F2` | Subtle background, card surfaces |
| 溫暖米 | `#F0EBE5` | Section backgrounds, warm neutrals |

### Semantic — filled from 友植會計師事務所 (A.M. CPA)

| Name | Hex | Semantic Role |
|------|-----|---------------|
| 裁切綠 | `#377456` | Success, positive states, confirmation |
| 清新綠 | `#CAD6BC` | Success muted, subtle positive backgrounds |
| 友善綠 | `#5CA8A3` | Info / teal accent, active states |
| 理性灰 | `#7A7C81` | Muted info, secondary interactive |
| 友善棕 (AM) | `#84724D` | Warm dark accent, earthy emphasis |
| 權威灰 | `#3A3830` | Near-black text, dark surfaces |

### Neutral Scale

| Name | Hex | Use |
|------|-----|-----|
| 權威灰 | `#3A3830` | Primary dark text, near-black |
| 專業灰 | `#797C80` | Secondary text, muted |
| 親切藍 | `#9AA7B9` | Tertiary text, borders, dividers |
| 溫和米 | `#EAE5E3` | Lightest surface, off-white |

---

## 3. Typography Rules

### Font Families

| Language | Display / Heading | Body |
|----------|-------------------|------|
| English | Baskerville Semibold | Baskerville Regular |
| 中文 | Noto Serif TC（思源宋體）| Noto Sans TC（思源黑體）|

> **Fallbacks:** `Georgia, serif` for English; `"Heiti TC", sans-serif` for Chinese.

### Hierarchy

| Role | EN Font | ZH Font | Size | Weight | Line Height | Letter Spacing |
|------|---------|---------|------|--------|-------------|----------------|
| Display Hero | Baskerville Semibold | Noto Serif TC | 72–96px | 600 | 1.10 | -0.5px |
| Section Heading | Baskerville Semibold | Noto Serif TC | 48px | 600 | 1.15 | -0.3px |
| Sub-heading | Baskerville Semibold | Noto Serif TC | 32px | 600 | 1.20 | -0.2px |
| Card Title | Baskerville Semibold | Noto Serif TC | 24px | 600 | 1.25 | normal |
| UI Label | Baskerville Regular | Noto Sans TC | 18px | 400 | 1.40 | 0.1px |
| Body Large | Baskerville Regular | Noto Sans TC | 18px | 400 | 1.70 | 0.05px |
| Body | Baskerville Regular | Noto Sans TC | 16px | 400 | 1.75 | 0.05px |
| Caption | Baskerville Regular | Noto Sans TC | 14px | 400 | 1.60 | 0.1px |

### Principles
- **Serif-first identity**: Baskerville brings prestige and trust; do not swap for sans-serif in headings.
- **CJK line-height**: Always 1.60+ for body, 1.75 preferred — CJK characters need more vertical breathing room.
- **Bilingual pairing**: EN and ZH run side-by-side or stacked; maintain consistent size ratio (EN ≈ ZH × 0.95 visually).
- **No heavy condensing**: Avoid letter-spacing below -0.5px — Baskerville is a text typeface, not billboard-scale grotesque.

---

## 4. Component Stylings

### Buttons

**Primary (城信藍)**
```
Background: #005FA2
Text: #FFFFFF
Padding: 12px 28px
Border-radius: 6px
Font: Baskerville Semibold / Noto Sans TC, 16px
Hover: background #004A82, transition 200ms ease
Focus: 0 0 0 3px rgba(0, 95, 162, 0.3)
```

**Secondary (outlined)**
```
Background: transparent
Text: #005FA2
Border: 2px solid #005FA2
Padding: 12px 28px
Border-radius: 6px
Hover: background rgba(0, 95, 162, 0.06)
```

**Ghost / Warm**
```
Background: #BE9F86
Text: #FFFFFF
Padding: 12px 28px
Border-radius: 6px
Hover: background #A88B74
```

**Danger / Alert**
```
Background: transparent
Text: #377456 (success) / #3A3830 (neutral)
Border: 1.5px solid currentColor
Border-radius: 6px
```

**Focus (all variants)**
```
outline: none（不使用瀏覽器預設藍色外框）
每個 variant 的 focus ring 採用該 variant 自己的主色，而非統一藍色：
  primary → rgba(0, 95, 162, 0.3)     outline → rgba(0, 95, 162, 0.2)
  warm    → rgba(168, 139, 116, 0.4)  ghost   → rgba(154, 167, 185, 0.5)
  danger  → rgba(221, 107, 95, 0.3)
僅鍵盤導覽（:focus-visible）觸發，滑鼠點擊不顯示，避免棕色等按鈕上出現不搭調的藍色外框
```

> Note: Pill variant (border-radius: 9999px) available for marketing / hero CTAs only.

### Cards & Containers
```
Background: #FFFFFF or #F5F3F2
Border-radius: 10px (small cards), 16px (feature cards)
Border: 1px solid rgba(154, 167, 185, 0.3)
Padding: 24px–40px
No shadows — flat by default
```

**Dark card variant (城信藍 surface):**
```
Background: #005FA2
Text: #FFFFFF
Border-radius: 16px
```

### Choice Modal（選擇型彈窗）

用途：一個動作有多種進入方式時（如「新增交易」可選手開發票／電子發票／匯入電子發票），
先讓使用者選類型再導向對應流程。

```
容器：Modal widthClassName="max-w-[480px]"
選項列：垂直排列，gap 8px（gap-2）
  每列：w-full、rounded-md（6px）、border 1px #C7CDD3（neutral-blue-gray/50）、px-4 py-3、bg #FFFFFF
  左：lucide 圖示 20px，色 #005FA2（brand-primary）
  中：標題 Noto Sans TC 14px font-semibold #3A3830；副標 12px #797C80
  Hover：border-color #005FA2、bg rgba(0, 95, 162, 0.05)
  無陰影（符合扁平原則）
```

### Bottom Sheet（行動版底部面板）

用途：手機（< nav 1000px）下需要一份完整表單但螢幕沒有並排空間時，把表單疊在當前畫面下方，
可下拉／點遮罩／Esc 關閉回到原畫面且狀態不流失（如沖帳中心的金額表單）。桌機一律不出現，
改回原本的並排／sticky 面板呈現。

```
容器：portal 至 document.body（沿用 Modal.tsx 的 createPortal / Escape 監聽 / 鎖背景捲動邏輯）
遮罩（scrim）：fixed inset-0、bg-neutral-dark/40、z-[55]
面板：fixed inset-x-0 bottom-0、z-[60]
  背景：#FFFFFF
  圓角：rounded-t-lg（僅上緣兩角，10px）
  陰影：shadow-level1（浮動面板，符合陰影例外規則）
  內容區：max-h-[80vh]、overflow-y-auto、overscroll-contain
  內距：px-4 pb-4（另加 pb 隨安全區域 env(safe-area-inset-bottom)）
拖曳握把：頂部置中、40×4px、bg #9AA7B9（neutral-blue-gray/40）、整條握把區為 min-h-11 的按鈕
  （符合 44px 熱區），點擊或下拉（位移 > 80px）即關閉
過渡：面板 translate-y transition-transform（--transition-base 200ms）；遮罩 opacity 同步淡入淡出
nav:hidden（≥ nav 1000px 不掛載）
```
對應元件：`src/components/ui/BottomSheet.tsx`。

### Sticky Action Bar（行動版底部固定操作條）

用途：手機版清單頁在使用者捲動瀏覽時，仍需隨時看到目前已選摘要與主要動作按鈕（如沖帳中心的
「已選 N 筆／金額」+「確認金額」）。桌機一律不出現，主要動作改回置於側欄面板內。

```
容器：fixed inset-x-0 bottom-0、z-30
背景：#FFFFFF
邊框：上緣 1px #C7CDD3（neutral-blue-gray/30）
內距：px-4 py-3，另加 pb-[calc(12px+env(safe-area-inset-bottom))] 避開 iOS Home Indicator
內容：左側摘要文字（label 12px #797C80 + 金額 14px 半粗體 #3A3830）、右側／下方主要按鈕（Button
  variant="primary"、滿版寬度）
nav:hidden（≥ nav 1000px 不掛載）
```
對應元件：`src/features/reconciliation/components/ReconMobileActionBar.tsx`（沖帳中心專用範例，
其餘頁面如需相同模式可比照建立）。

**z-index 分層**（由低到高，新增 Bottom Sheet／Sticky Action Bar 後的完整順序）：
```
z-30  Sticky Action Bar（行動版底部固定操作條）
z-40  AppShell 手機固定頂部列
z-50  Sidebar 行動版 Overlay 抽屜
z-[55] Bottom Sheet 遮罩
z-[60] Bottom Sheet 面板
z-[70] Modal（確認彈窗等）
z-[80] Popover（日期篩選、下拉選單等）
z-[90] 全螢幕選擇頁（手機版科目選擇器，見 Subject Picker）
```
Bottom Sheet 蓋在底部操作條與側邊欄 Overlay 之上，但仍低於 Modal／Popover——彈窗與下拉選單需要能
疊在 Bottom Sheet 上方顯示（如面板內開出的確認沖帳彈窗）。

### Form Inputs
```
Border: 1.5px solid #9AA7B9
Border-radius: 6px
Padding: 10px 14px
Font: Baskerville Regular / Noto Sans TC
  手機（< nav 1000px）：16px（text-base）—— 低於 16px 會觸發 iOS Safari 聚焦時自動放大版面，
    放大後不會自動縮回，後續點擊座標全部偏移，故手機一律不可小於此值
  桌機（≥ nav 1000px）：14px（text-sm）—— 維持原有密度
Focus border: #005FA2
Focus shadow: 0 0 0 3px rgba(0, 95, 162, 0.15)
Error border: #DD6B5F（開創紅，semantic-error）
```

**必填標示（Required Field Marker）**（表單欄位 label 右側標示必填）
```
符號: * （緊接 label 文字右側）
Color: #DD6B5F（開創紅，semantic-error）
Margin-left: 4px（ml-0.5）
aria-hidden: true（不由螢幕報讀器唸出）
```
語意：僅用於「送出時會驗證、會擋下送出」的欄位；純選填欄位不加星號。
對應元件：`src/components/ui/Label.tsx` 的 `required` prop；
`src/features/ledger/transaction/components/Field.tsx` 的 `required` prop（transaction feature 專用欄位包裝）。

**Error Message**（欄位下方驗證錯誤提示，如必填未填、密碼不一致）
```
Color: #DD6B5F（開創紅，semantic-error）
Font: Noto Sans TC 12px（text-xs）
Margin-top: 4px（mt-1）
不使用圖示，僅文字；輸入框本身可疊加 Error border
```

**Textarea**（多行輸入，如備註）
```
Border: 1.5px solid #9AA7B9
Border-radius: 6px（沿用 rounded-lg 視覺，同 TextInput）
Padding: 8px 12px
Font: Baskerville Regular / Noto Sans TC, 14px
預設 4 rows，不可縮放（resize: none）
Focus border: #005FA2
Focus shadow: 0 0 0 3px rgba(0, 95, 162, 0.15)
Disabled: 背景 #EAE5E3，文字 專業灰 #797C80
```
對應元件：`src/components/ui/Textarea.tsx`。

**金額輸入正負切換（Signed Money Input）**（金額欄位需要讓使用者選擇正值或負值，如沖帳中心的手續費、額外金額）
```
容器（toggle）：28×28px（h-7），rounded-md（6px）、bg #EAE5E3（surface-cream）、內距 2px（p-0.5）、
  內含兩顆等寬選項（各 h-6 w-6），同時顯示正／負兩個狀態，不像單顆按鈕需點擊才知道另一狀態
  已選取：背景 #005FA2（brand-primary）、圖示 #FFFFFF
  未選取：圖示 #797C80（neutral-mid），Hover 背景 #F0EBE5（surface-warm）、圖示轉 #3A3830
  圖示: lucide Plus（正，左）/ Minus（負，右），14px
  Disabled：整個容器 opacity 50%、cursor-not-allowed，兩顆選項皆不 hover
排列：toggle 容器 + 金額輸入框，中間 gap 6px（gap-1.5），toggle 在左
輸入框本身沿用上方 Form Inputs 規格，顯示絕對值（不顯示負號字元），正負完全由 toggle 選取狀態表達
```
對應元件：`src/components/ui/MoneyInput.tsx` 的 `allowSign` prop（選用，預設關閉時為一般金額輸入，行為不變）。

### Navigation — Sidebar（側邊欄導覽）

全站主導覽為**左側可開關的側邊欄**（取代舊版頂部固定列），對應元件 `src/components/sideBar.tsx` +
`src/components/AppShell.tsx`。

```
寬度：預設 256px（w-64，8px 系統倍數），桌機（≥ nav 1000px）可拖曳調整，範圍 200–400px，
      僅本次瀏覽有效（不持久化）；手機（< nav 1000px）固定 256px，不可拖曳
背景：#FFFFFF
邊框：右側 1px #EAE5E3（surface-cream），取代原頂部列的 bottom border
文字：Noto Sans TC 14px，#3A3830（權威灰）
Active / hover：文字 #005FA2（城信藍）+ 背景 #EAE5E3（surface-cream）
項目：垂直排列，rounded-md（6px）、px-3 py-2

結構（由上至下）：
  1. 頁首（手機：「選單」文字 + X 關閉鈕／桌機：Logo + 收合鈕）
  2. 捷徑按鈕（Shortcut，見下方）
  3. 導覽項目（可捲動區）
  4. 登出（頁尾，固定）

捷徑按鈕（Shortcut）：
  位置：導覽清單最上方，與清單之間 1px #EAE5E3 分隔
  樣式：Button variant="warm"（bg #BE9F86 實心 / 白字）、size md、滿版寬度、左側 Plus 圖示
  用途：跨頁面的高頻主要動作（目前僅「開立電子發票」），非一般導覽項目
  一個側欄最多一顆，避免主行動色失焦

動作型選單項目（action item）：
  外觀與一般子項目相同（縮排、SquarePlus 圖示、hover 樣式）
  差異僅在點擊後開啟彈窗（如「新增交易」開 Choice Modal）而非導頁；語意上為 <button> 而非 <a>

下拉子項目：向下展開於父項目下方，縮排 + 左側 1px #EAE5E3 分隔線
圖示：一律 lucide-react

含子項目的父項目：
  點擊文字直接導覽至父項目 path（通常等同該群組總覽頁），並自動展開子項目
  子項目路徑為目前頁面時，父項目自動維持展開；點擊右側 chevron 圖示可手動覆蓋展開/收合狀態
  路由切換時清除手動覆蓋，回到「依目前路徑自動展開」的預設狀態

拖曳分隔線（僅桌機）：
  位置：側邊欄右邊界，寬度 4px（w-1）、cursor-col-resize
  預設透明，hover / 拖曳中顯示 brand-primary 半透明提示色（無陰影，符合扁平原則）
  拖曳時同步更新側邊欄寬度與主內容 margin-left（透過 CSS variable 保持一致）

手機固定頂部列（< nav 1000px，取代桌機浮動開關鈕）：
  高度 h-14（56px）、bg #FFFFFF、底部 1px #EAE5E3 邊框、z-40
  左：Logo（100px 寬）；右：開啟選單鈕（Menu 圖示）
  對應元件：src/components/AppShell.tsx 內的 <header>

開關鈕：
  手機（< nav 1000px）：固定頂部列右側 Menu 圖示開啟；側邊欄頁首內 X 圖示關閉
  桌機（≥ nav 1000px）：收合時浮動於畫面左上角（Menu 圖示）；開啟時側邊欄頁首內為收合鈕（PanelLeftClose）

深度：
  桌面（Push，側邊欄為版面一部分）→ 扁平，僅右側 1px 邊框，無陰影
  手機（Overlay，浮於內容上）→ shadow-level1（唯一陰影例外，同浮動選單規則）

行為：
  桌面（≥ nav 1000px）：Push — 側邊欄固定於左側，主內容向右推移側邊欄目前寬度（預設 256px，可拖曳 200–400px）
  手機（< nav 1000px）：Overlay — 側邊欄自畫面右側滑出（fixed right-0）+ 半透明遮罩（bg-neutral-dark/40），主內容不位移，並保留 pt-14 淨空對應固定頂部列

過渡：側邊欄 transition-transform；主內容 transition-[margin]
```

### Status Badge

用於顯示狀態徽章（如：已完成、成功、開業/停業/復業）。對應元件：`src/components/ui/Badge.tsx`。

```
Variant: solid（純色底 + 白字，用於強調中的當前狀態）
  success → bg #377456, text #FFFFFF
  error   → bg #DD6B5F, text #FFFFFF
  info    → bg #005FA2, text #FFFFFF
  neutral → bg #797C80, text #FFFFFF

Variant: muted（淺底 + 深色字，用於次要/列表中的狀態標示，預設）
  success → bg #CAD6BC, text #2D6347
  error   → bg rgba(221,107,95,0.1), text #DD6B5F
  info    → bg rgba(0,95,162,0.1), text #005FA2
  neutral → bg #EAE5E3, text #797C80

Border-radius: 4px
Padding: 2px 8px
Font: Noto Sans TC 12px, font-weight 600
```

色彩語意（與本文件「2. Color Palette & Roles」對應，優先於視覺草稿）：
- 成功／正面／已完成／開業 → success
- 錯誤／停業 → error
- 進行中狀態／復業 → info

### Sortable Table Header

用於可點擊排序的表格欄位標題（如帳簿、營業稅中心的列表表頭）。

```
未排序（預設）：
  文字色：#3A3830（權威灰，同一般表頭）
  圖示：ChevronsUpDown，#9AA7B9（親切藍 / neutral-blue-gray）

已排序（active）：
  文字色：#005FA2（城信藍 / brand-blue）
  圖示：ChevronUp（asc）或 ChevronDown（desc），#005FA2

Hover：文字與圖示轉為 #005FA2（城信藍），無底色變化
點擊行為：三態循環 none → asc → desc → none
圖示大小：12px，緊貼文字右側（gap 4px）
```

對應元件：`src/features/ledger/components/LedgerTable.tsx`、`src/features/business-tax/components/InvoiceTable.tsx` 的 `SortHeader`。

### Tab Bar (Underline)

用途：附著於資料表格頂部的檢視切換（如帳簿應收/已收款、應付/已付款）。
與主層級切換（`SegmentedControl` 藍底白字）在視覺上明確區隔，避免兩層切換樣式雷同難以分辨。

```
未選取：文字 #797C80（neutral-mid），底線透明
        hover：文字轉 #3A3830（neutral-dark）
已選取（active）：文字 #005FA2（城信藍 / brand-blue），下方 2px #005FA2 底線
基線：分頁列底部 1px 淺灰（neutral-blue-gray/40，同表頭分隔線），active 底線壓在基線上
字體：Noto Sans TC 14px, font-weight 600
間距：每個分頁 px 12px、py 12px；分頁間 gap 4px
```

**停用狀態（Disabled）**（功能尚未開放的分頁，如沖帳中心「多筆沖帳」等待後端 API）
```
文字：#9AA7B9（neutral-blue-gray），底線透明（不隨選取狀態改變）
不可點擊：cursor-not-allowed，無 hover 效果
說明：以原生 title 屬性顯示滑鼠停留提示，說明尚未開放原因
```

對應元件：`src/components/ui/TabBar.tsx`（`TabBarOption.disabled` / `hint`）。

### Step Number Badge（操作順序編號）

用途：同一頁面內有多個必須依序完成的操作區塊時，在各區塊標題前標示順序編號
（如沖帳中心：選擇管道 → 選擇交易 → 輸入金額）。步驟數會隨模式改變，故編號由呼叫端傳入。

```
徽章：inline-flex、h-5 w-5、rounded-full、bg #005FA2（brand-primary）、色 #FFFFFF
字：Noto Sans TC 12px font-semibold、tabular-nums、置中
與標題文字間距：8px（gap-2）
標題本身沿用該區塊原有字級／字重，不因加編號而改變
aria-hidden：true（順序資訊由視覺呈現，不重複報讀）
```
對應元件：`src/components/ui/StepNumber.tsx`。

### Allocation Row（沖帳對象分配列）

用途：一筆實際存入／付出金額需要分配給多個對象（銀行帳戶／會計科目）時，以「主對象自動補足
未分配金額＋可增減的分出列」呈現（如沖帳中心的沖帳對象分配）。窄欄容器（如沖帳中心右欄
340px 面板）一律採上下堆疊排版，不左右並排。

```
主對象列：rounded-lg（10px）、border-[1.5px] border-brand-blue/40、bg-brand-blue/5、p-3
分出列：  rounded-lg（10px）、border border-neutral-blue-gray/30、bg #FFFFFF、p-3
列間距：8px（gap-2）

角色徽章：沿用 Status Badge 元件（variant="muted"）
  主對象 → tone="info"（bg rgba(0,95,162,0.1)、文字 #005FA2）
  分出   → tone="neutral"（bg #EAE5E3、文字 #797C80）

對象下拉：h-10、rounded-lg、border-[1.5px] border-neutral-blue-gray/50，樣式比照 Form Inputs；
  選單列出銀行帳戶（顯示目前餘額）與可用會計科目（餘額未提供時顯示「—」），
  已被其他列選走的固定科目於選單中 disabled

副標文字（帳號／科目代碼／餘額）：Noto Sans TC 12px（text-xs）、#797C80（neutral-mid）
分配金額：font-mono、tabular-nums，16px（text-base）font-semibold、#3A3830；
  金額為負（分出總額超額）時轉 #DD6B5F（semantic-error）

彙總列：上緣 border-t 1px rgba(154,167,185,0.3)（neutral-blue-gray/20）、mt-3 pt-3
  左側說明：12px（text-xs）#797C80
  右側總額：16px（text-base）font-semibold tabular-nums #3A3830

新增對象按鈕：Button variant="outline" size="sm" icon={Plus}，滿版寬度，
  與同容器內其他「新增」按鈕（如額外金額編輯器）視覺一致
移除按鈕：圖示按鈕（lucide Trash2），h-7 w-7，hover 轉 #DD6B5F（semantic-error）
```
對應元件：`src/features/reconciliation/components/ReconTargetAllocation.tsx`、
`src/features/reconciliation/components/ReconTargetSelect.tsx`。

### Subject Picker（分頁式科目選擇器）

用途：科目數量較多、使用者不熟悉科目代碼的情境（如銀行新增交易），在既有的單層搜尋下拉之外，
提供「常用／基礎／全部」三個分頁瀏覽，並附一個 AI 輔助入口（描述交易文字，呼叫 POST /ael/subject/identify
取得建議科目，內容與科目辨識無關或無法辨識時後端回 400）。與帳簿、折讓、沖帳中心等頁面仍在用的單層
`SubjectSelect` 並存，不互相取代。

```
觸發器：h-10、rounded-lg、border-[1.5px] border-neutral-blue-gray/50，樣式同 Form Inputs／
  現有 SubjectSelect 觸發器

面板（桌機為 Popover，手機為全螢幕頁，兩者共用同一套內部排版）：
  1. 搜尋列：放大鏡圖示 + input（text-base，nav 斷點以上 text-sm，防 iOS 自動放大）+
     有輸入時右側「清除」
  2. 分頁列（底線式，樣式同 Tab Bar (Underline)）：常用／基礎／全部，各自右側附小字灰色計數；
     **有輸入搜尋字時整列隱藏**，搜尋範圍自動視為「全部」
  3. 分類說明列：bg-surface-cream、text-xs、text-neutral-mid，一行文字說明目前分頁的排序／篩選依據
  4. 搜尋範圍提示列（僅搜尋時顯示）：bg-brand-blue/5、text-brand-blue、text-xs，
     顯示「搜尋範圍為完整科目表，找到 N 筆符合「關鍵字」」
  5. 科目清單：可捲動，桌機 max-h-80（320px）；每列代碼（font-mono、tabular-nums）+ 名稱，
     選中列 bg-brand-blue/10 + 右側 Check 圖示；一律扁平列表，不做主／子科目分組或說明文字
     （官方科目 API 目前無父子階層與 remark 資料）
  6. 空狀態（搜尋無結果）：置中圖示 + 標題「找不到「關鍵字」」+ 說明 + 主要按鈕「讓 AI 判斷」
  7. 底部固定 AI 入口列：bg-surface-warm、border-t border-brand-tan/30，
     文字「不確定用哪個科目？描述這筆交易，讓 AI 幫你選」，點擊展開 AI 區塊

AI 區塊（暖色面，展開於面板底部）：
  bg-surface-warm、border-t border-brand-tan/30、p-3
  內含：說明文字、textarea（描述交易）、範例 chip（rounded-sm border border-brand-tan/50）、
  送出按鈕（variant="warm"，暖色區維持單一色相，不與城信藍混用）、
  loading 態（LoaderCircle 動畫 + 說明文字）、建議卡（最多 3 張，首選卡
  border-[1.5px] border-brand-blue/40 + Badge tone="info" 標示「首選」）
  選定後於觸發器下方顯示「AI 已為你選擇」註記列（bg-surface-warm、text-xs）+ 「重新詢問」連結；
  手動從清單改選會清除此註記

手機全螢幕頁（< nav 1000px）：
  fixed inset-0、z-[90]、bg-white，取代 Popover；頂部標題列「選擇會計科目」+ 右側「取消」
  分頁列可橫向捲動；清單列最小高度 48px（見 Touch Target）
  科目選取採兩段式：第一次點擊該列右側顯示「確認」按鈕，第二次點擊（或點確認）才真正選定，
  避免手機誤觸直接送出
  搜尋框不 autoFocus（避免虛擬鍵盤立即遮住清單與底部 AI 入口列）
```

對應元件：`src/components/ui/SubjectPicker.tsx`（觸發器與狀態）、
`src/components/ui/SubjectPickerPanel.tsx`（面板內容）、
`src/components/ui/SubjectAiAssistant.tsx`（AI 輔助區塊）。

---

## 5. Layout Principles

### Spacing System (8px base)
```
4px  — micro gaps (icon-to-label)
8px  — tight internal spacing
12px — compact padding
16px — standard component padding
24px — card internal padding
32px — section sub-spacing
48px — component separation
64px — section spacing
80px — large section breaks
120px — hero / page-level spacing
```

### Border Radius Scale
```
4px   — badges, tags, small chips
6px   — buttons, inputs, small cards
10px  — standard cards
16px  — feature / hero cards
9999px — pill CTAs (marketing only)
```

### Grid
- Desktop: 12-column, 1200px max-width, 24px gutters
- Tablet: 8-column, 720px, 16px gutters
- Mobile: 4-column, full-width, 16px gutters

### Touch Target
互動元素（按鈕、勾選圓圈、關閉鈕、圖示按鈕等）最小可點區為 **44×44px**；視覺尺寸可依元件規格小於此值
（如金額輸入正負切換鈕維持 24×24px 的視覺大小，見上方 Form Inputs 章節），但須以透明 padding 或
`before:absolute before:-inset-*` 擴大實際可點擊範圍至 44×44px，不得讓視覺尺寸即為熱區尺寸。

**清單列例外**：可捲動清單中逐列可點的列項（如全螢幕選擇頁的科目列）不受 44px 限制，
最小高度以 48px（`min-h-12`）為準，兩者皆遠高於一般文字行高，足以避免誤觸。

---

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Flat (0) | No shadow | All surfaces — default |
| Subtle (1) | `0 1px 4px rgba(58,56,48,0.08)` | Floating menus, dropdowns only |
| Focus | `0 0 0 3px rgba(0,95,162,0.25)` | Keyboard focus ring |

**Shadow Philosophy**: Follow Revolut's flat-first principle. Depth comes from section color contrast (white ↔ 城信藍 ↔ 清爽白) and generous whitespace. Avoid decorative shadows.

---

## 7. CSS Custom Properties (Token Reference)

```css
:root {
  /* === PRIMARY — Relianz === */
  --color-brand-blue: #005FA2;
  --color-brand-blue-dark: #004A82;
  --color-brand-blue-light: #3380B8;
  --color-brand-tan: #BE9F86;
  --color-brand-tan-dark: #A88B74;

  /* === SEMANTIC — A.M. CPA fill-ins === */
  --color-success: #377456;
  --color-success-muted: #CAD6BC;
  --color-info: #5CA8A3;
  --color-info-muted: #7A7C81;
  --color-warm-dark: #84724D;

  /* === NEUTRAL === */
  --color-dark: #3A3830;
  --color-mid: #797C80;
  --color-light-blue-gray: #9AA7B9;
  --color-surface-warm: #F0EBE5;
  --color-surface-off-white: #F5F3F2;
  --color-surface-cream: #EAE5E3;
  --color-white: #FFFFFF;

  /* === TYPOGRAPHY === */
  --font-display-en: 'Baskerville', 'Baskerville Old Face', 'Big Caslon', Georgia, serif;
  --font-body-en: 'Baskerville', Georgia, serif;
  --font-display-zh: 'Noto Serif TC', '思源宋體', 'Songti TC', serif;
  --font-body-zh: 'Noto Sans TC', '思源黑體', 'PingFang TC', 'Heiti TC', sans-serif;

  /* === SPACING === */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
  --space-12: 48px;
  --space-16: 64px;
  --space-20: 80px;
  --space-30: 120px;

  /* === RADIUS === */
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 10px;
  --radius-xl: 16px;
  --radius-pill: 9999px;

  /* === TRANSITIONS === */
  --transition-fast: 150ms ease;
  --transition-base: 200ms ease;
  --transition-slow: 350ms ease;
}
```

---

## 8. Responsive Breakpoints

專案唯一自訂斷點為 `nav`（`tailwind.config.js` `theme.screens.nav: '1000px'`），對應 Tailwind 的
`nav:` 前綴；**不使用** Tailwind 預設的 `sm` / `md` / `lg` / `xl` 斷點，避免同一專案出現兩套斷點語意。

| 區間 | 寬度 | 說明 |
|------|------|------|
| 手機（< nav） | < 1000px | 單欄堆疊、卡片式版面、側邊欄收合為橫向 chips 或 Overlay；需要並排欄位（如同時輸入表單＋看清單）時改用 Bottom Sheet 疊加，主要動作常駐 Sticky Action Bar（見 §4 Bottom Sheet / Sticky Action Bar） |
| 桌機（≥ nav） | ≥ 1000px | 多欄／可拖曳分割面板、欄位化表格、Sidebar 固定於左側 |

實作慣例：預設樣式即手機版，桌機專屬樣式一律加 `nav:` 前綴覆寫（mobile-first）。

---

## 9. Do's and Don'ts

### Do
- Use Baskerville Semibold / Noto Serif TC for all headings
- Use 城信藍 (`#005FA2`) as the primary interactive color
- Apply 友善棕 (`#BE9F86`) as a warm accent — sparingly
- Use 裁切綠 (`#377456`) for success and positive states
- Maintain flat surfaces; depth via color contrast only
- Keep CJK body line-height at 1.60+
- Use bilingual text pairings consistently (EN + ZH same section)

### Don't
- Don't use Inter, Roboto, or system sans-serif for headings
- Don't mix too many accent colors — pick blue OR tan per component
- Don't use pill buttons outside of hero / marketing contexts
- Don't apply 友植 greens as primary interactive colors — they are semantic supplements only
- Don't add decorative drop shadows to cards or sections
- Don't use 開創紅 (`#DD6B5F`) from Relianz secondary palette unless for explicit error/alert states

---

## 10. Agent Prompt Guide

### Quick Color Reference
```
Primary:     城信藍   #005FA2
Accent warm: 友善棕   #BE9F86
Dark text:   權威灰   #3A3830
Success:     裁切綠   #377456 (from A.M. CPA)
Info/teal:   友善綠   #5CA8A3 (from A.M. CPA)
Surface:     清爽白   #F5F3F2
Background:  溫暖米   #F0EBE5
White:                #FFFFFF
```

### Example Prompts
- "Build a hero section: white background. Heading 72px Baskerville Semibold + Noto Serif TC, line-height 1.10, color #3A3830. Primary CTA: #005FA2 background, white text, 6px radius, 12px 28px padding. Secondary CTA: outlined #005FA2."
- "Create a success toast: #377456 left border, #F5F3F2 background, Noto Sans TC 15px, icon + message layout."
- "Design a feature card: #FFFFFF surface, 16px radius, 1px border #9AA7B9 at 30% opacity, 32px padding. Title in Noto Serif TC 24px #005FA2, body Noto Sans TC 16px #3A3830."

### Color Priority Logic
1. **Interactive elements** (buttons, links, focus) → 城信藍 `#005FA2`
2. **Decorative accent** (logo highlights, dividers, warm sections) → 友善棕 `#BE9F86`
3. **Success / positive** → 裁切綠 `#377456`
4. **Info / teal** → 友善綠 `#5CABA3`
5. **Muted / disabled** → 親切藍 `#9AA7B9` or 專業灰 `#797C80`
6. **Dark backgrounds** → 城信藍 `#005FA2` or 權威灰 `#3A3830`
