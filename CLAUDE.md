# CLAUDE.md

## 專案概述

Easytax Lite — Next.js 14（App Router）+ TailwindCSS 3 專案。目前為初始骨架，僅包含全站共用的
固定 Navbar 與設計系統基礎設定，尚未有實際業務頁面/功能，會隨開發逐步擴充。

## 語言規範

| 項目 | 語言 |
|------|------|
| Claude 回應 | 繁體中文 |
| 程式碼註釋 | 中文優先（通用函數可用英文） |
| 變數/函數命名 | 英文 |
| 用戶訊息、Toast、錯誤文字 | 繁體中文 |

## 核心開發原則

- **簡潔至上**：不添加未被要求的功能，修 Bug 不順便重構
- **可讀性優先**：程式碼要清晰而非聰明，複雜邏輯加中文註釋說明「為什麼」
- **模塊化設計**：將系統分為明確的模塊，提取重複邏輯為公共函數，避免 copy-paste
- **最小化影響**：改動限制在最小範圍，避免波及其他模塊
- **保持最低耦合**：模塊依賴越少越好，依賴方向只能由上往下
- **避免過度設計**：專案目前規模精簡，不預先搭建未使用的分層或抽象，等真正需要時再擴充

---

## ⚠️ 不捏造規則

- **絕不捏造** API、函式庫方法或設定選項
- **絕不猜測**語法或行為——先查詢再回答
- **使用 Context7 MCP** 獲取函式庫/框架的最新文件，無需明確要求
- 無法確定時，明確說「我不知道，需要查詢文件」

需要驗證的警示用語（出現即代表在猜測）：

- ❌「我認為這個 API……」
- ❌「這應該可以運作……」
- ❌「通常這樣做……」

---

## 介面開發鐵律：嚴格參照 DESIGN.md（強制）

**所有介面開發與基礎元件（`src/components/`）皆須嚴格對齊根目錄 `DESIGN.md`，確保整個系統規格統一。**

- **色彩、字體、間距、圓角、陰影、斷點**一律使用 `DESIGN.md` 定義並同步於 `tailwind.config.js` /
  `globals.css` 的設計 token（如 `surface-off-white`、`brand-primary`、`nav:` 斷點），
  **禁止**憑感覺自訂新的 hex 色碼、隨意的 px 數值或一次性樣式。
- 新增或修改任何元件前，先查閱 `DESIGN.md` 對應章節（色彩系統／字體階層／元件樣式／版面與間距／
  深度與層級／響應式斷點）；**規格先行，實作在後**。
- 若 `DESIGN.md` 尚未涵蓋某元件樣式，**先擴充 `DESIGN.md`（並與使用者確認）再實作**，
  不允許各元件各自發揮、產生風格不一致的介面。
- 修改既有元件樣式與 `DESIGN.md` 衝突時，以 `DESIGN.md` 為準；如需變動設計規範本身，
  需先與使用者確認再同步調整文件與程式碼。
- **元件選擇優先順序**：
  1. 優先使用 `src/components/` 現有元件
  2. 需要新元件時，直接依 `DESIGN.md` 規範實作，Tailwind className 保持簡潔
  3. 避免堆疊自定義複雜樣式或內嵌 magic number
- **圖示（icon）一律使用 `lucide-react`**，不得手刻 inline SVG、不得使用其他圖示庫（如
  `@radix-ui/react-icons`、`react-icons`），確保全系統圖示風格統一。
- **嚴格禁止在介面（畫面）上使用 emoji**，包含按鈕、標題、提示訊息、空狀態等任何使用者可見之處；
  需要圖示語意時一律改用 `lucide-react` 對應圖示。

### 設計系統快速參考（詳見 `DESIGN.md`）

| 用途 | 顏色 |
|------|------|
| 主要互動（按鈕、焦點） | 城信藍 `#005FA2` |
| 裝飾重音 | 友善棕 `#BE9F86` |
| 成功/正面 | 裁切綠 `#377456` |
| 錯誤 | 開創紅 `#DD6B5F` |
| 主要文字 | 權威灰 `#3A3830` |
| 背景 | 清爽白 `#F5F3F2` |

設計原則：
1. **清晰優於裝飾** — 資訊層次優先
2. **溫暖的專業感** — 城信藍建立信任，友善棕帶來溫度
3. **扁平但有層次** — 不用陰影（浮動選單除外），靠色彩、留白、字重建立層次
4. **桌面優先，手機可用**

關鍵規格：字體顯示用 Noto Serif TC、正文 Noto Sans TC，CJK 行高 **1.75**；
間距 8px 基底系統；圓角 4–10px（保守）；僅 **Light Mode**。

---

## 分層架構（未來擴充時遵循）

專案成長時請依三層架構分工，避免邏輯散落各處：

```
業務層 src/app/**                          嚴禁 any、不直接呼叫 API
    ↓
邏輯層 src/features/**/hooks/**、form/**    慎用 any，優先明確類型或泛型
    ↓
公用底層 src/components/**、src/utils/**、  適度使用 any（泛型約束、第三方庫整合）
        src/api/**、src/schemas/**
```

依賴方向只能由上往下（業務層 → 邏輯層 → 公用底層），不可反向依賴。

---

## 技術棧

- Next.js `14.0.4`（App Router，`src/app/`）
- React `^18`
- TailwindCSS `3.4.1`（無 DaisyUI，純 Tailwind + 自訂設計 token）
- TypeScript `^5`，`strict: true`
- 套件管理：npm（`package-lock.json` 為準；勿混用 pnpm/yarn 產生額外 lockfile）

## 路徑別名

`tsconfig.json` 定義 `"@/*": ["./src/*"]`，元件請用 `@/components/...` 匯入，勿用相對路徑跨層引用。

## 專案結構

```
src/
├── app/
│   ├── layout.tsx     # Root layout：字體、metadata、掛載 <Navbar />
│   ├── page.tsx        # 首頁
│   └── globals.css     # 設計系統 CSS 變數 + Tailwind 指令
├── components/
│   └── navBar.tsx       # 全站固定頂部 Navbar（fixed top-0，僅 logo，無登入/選單邏輯）
public/
└── logo.png
DESIGN.md                # 設計規範來源，新增/調整樣式前必查
tailwind.config.js        # 設計 token（colors/screens/fontFamily 等）
```

## Navbar 行為（重要）

- `Navbar` 使用 `fixed inset-x-0 top-0 z-50`，故頁面內容需包在 `pt-16`（見 `layout.tsx`）避免被遮擋。
- `html, body` 背景色設為 `--color-surface-off-white`，與 Navbar 同色，避免手機下拉回彈
  （overscroll bounce）時露出不同色背景。
- 新增頁面時不需重複處理 padding，`layout.tsx` 已全域套用。

## React / Next.js

- **預設 Server Component**，只有需要 hooks 或事件處理才加 `'use client'`
- **圖片**：新增內容圖片優先用 `next/image`；Navbar 的 logo 目前用原生 `<img>`（對齊來源專案樣式，
  勿隨意更動除非有明確理由）

## 錯誤處理（未來加入 API/表單時遵循）

- **元件層**：catch 區塊統一用 `error instanceof Error ? error.message : '操作失敗'` 模式呈現錯誤訊息
- **API 層**：日後導入 API 呼叫時，統一包裝錯誤處理並回傳完整 `response`，不要吞掉錯誤細節

## 開發工作流程

1. `npm run dev` 本地開發
2. `npm run build` 驗證編譯通過
3. 修改樣式前先確認 `DESIGN.md` 與 `tailwind.config.js` 是否已有對應 token，沒有則先擴充規範再實作
