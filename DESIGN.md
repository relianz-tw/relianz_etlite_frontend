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
切換鈕：24×24px（h-7 w-7）、rounded-md（6px）
  背景: #EAE5E3（surface-cream）
  Hover 背景: #F0EBE5（surface-warm）
  圖示: lucide Plus（正）/ Minus（負），14px，色彩隨文字 #797C80（neutral-mid）→ hover #3A3830
  Disabled：opacity 50%、cursor-not-allowed，維持背景不變（不 hover）
排列：切換鈕 + 金額輸入框，中間 gap 6px（gap-1.5），切換鈕在左
輸入框本身沿用上方 Form Inputs 規格，顯示絕對值（不顯示負號字元），正負完全由切換鈕圖示表達
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
| 手機（< nav） | < 1000px | 單欄堆疊、卡片式版面、側邊欄收合為橫向 chips 或 Overlay |
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
