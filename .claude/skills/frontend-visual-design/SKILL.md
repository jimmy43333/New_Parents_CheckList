---
name: frontend-visual-design
description: 新手爸媽準備清單 PWA 的視覺設計規範——涵蓋色彩、字體、間距、圓角、元件（無陰影/實邊框）、線性圖示、Toast、動效、RWD 斷點。任何前端、UI、樣式、設計相關的修改都應該先讀取這份規範，以保持視覺風格一致。
---

# 新手爸媽準備清單 — 視覺設計規範

這是「新手爸媽準備清單」PWA（Vue + Firebase，情侶共編待產/育兒準備清單）的視覺設計系統。訪談定案的品牌調性：**清新極簡、低干擾，帶一點陽光暖意的工具感**——大片留白、資訊密度優先、少裝飾，強調色選用溫潤的蜂蜜金黃而非冷灰或死板中性色，整體像一個俐落好用的清單工具，而非可愛童趣或高端奢華的產品。

任何前端 UI 修改（新增元件、調整版面、改配色等）都應該先參考這份規範，確保風格一致。

## Design Tokens

```css
:root {
  /* Color */
  --color-primary: #c98a1f; /* 蜂蜜金黃 — 主要按鈕、重點強調、選中狀態 */
  --color-primary-soft: #f3e4c4; /* 主色的淺底色，用於「進行中」卡片背景 */
  --color-secondary: #4c7a63; /* 深松綠 — 完成狀態、成功提示 */
  --color-secondary-soft: #deeae3; /* 輔色的淺底色，用於「已完成」卡片背景 */
  --color-bg: #f2f1ec; /* 頁面背景，米灰調 */
  --color-surface: #ffffff; /* 卡片/面板背景 */
  --color-ink: #1e1d1a; /* 主要文字 */
  --color-ink-soft: #5c594f; /* 次要文字/說明文字 */
  --color-ink-faint: #8d8a7e; /* 最淡文字，如時間戳 */
  --color-border: rgba(30, 29, 26, 0.22);
  --color-border-strong: rgba(30, 29, 26, 0.38);
  --btn-primary-ink: #1e1d1a; /* 主色按鈕上的文字色（金黃底用深色字，避免用白字對比不足） */

  /* Type scale */
  --text-xs: 0.72rem; /* 標籤、註記（一律大寫 + letter-spacing） */
  --text-sm: 0.82rem; /* 次要說明 */
  --text-base: 0.9rem; /* 內文 */
  --text-md: 1rem; /* 卡片標題 */
  --text-lg: 1.05rem; /* 區塊標題 */
  --text-xl: clamp(1.5rem, 3.6vw, 1.9rem); /* 頁面副標題 */
  --text-2xl: clamp(1.8rem, 4.4vw, 2.3rem); /* 頁面主標 */

  /* Spacing（4px 基礎單位，工具感偏緊湊，比一般設計略小一階） */
  --space-1: 3px;
  --space-2: 7px;
  --space-3: 11px;
  --space-4: 15px;
  --space-5: 22px;
  --space-6: 28px;

  /* Radius — 銳利、接近表單/工具的直角感，不用大圓角 */
  --radius-sm: 5px; /* 卡片、按鈕、輸入框 */
  --radius-md: 7px; /* Modal */
  --radius-full: 999px; /* 標籤、Pill */

  /* 不用陰影，用實邊框表現層級 */
  --border-width: 1.5px;

  /* Motion */
  --ease: cubic-bezier(0.4, 0, 0.2, 1);
  --duration: 0.15s;
}

[data-theme="dark"] {
  --color-primary: #e0a83c;
  --color-primary-soft: #3d2f14;
  --color-secondary: #6fa98c;
  --color-secondary-soft: #22301f;
  --color-bg: #16150f; /* 暖炭黑 */
  --color-surface: #201f18;
  --color-ink: #ece9dd;
  --color-ink-soft: #a7a392;
  --color-ink-faint: #6e6b5d;
  --color-border: rgba(236, 233, 221, 0.2);
  --color-border-strong: rgba(236, 233, 221, 0.34);
  --btn-primary-ink: #17160f;
}
```

字體家族沿用系統預設中文黑體，不引入外部字體：

```css
font-family:
  "PingFang TC",
  "Hiragino Sans TC",
  "Noto Sans TC",
  "Microsoft JhengHei",
  -apple-system,
  BlinkMacSystemFont,
  sans-serif;
```

**數字專用等寬字體**（金額、百分比、花費輸入框等）：

```css
font-family: "Roboto Mono", "SFMono-Regular", Consolas, monospace;
```

字重：頁面主標 800（extra bold）、區塊/卡片標題 700（bold）、內文 400（regular）。整體偏粗壯有力，對比鮮明，適合快速掃過的清單型介面。

## 元件風格規則

- **卡片/按鈕**：**不用陰影**，一律用 `var(--border-width)` 1.5px 實邊框 + `var(--radius-sm)` 5px 小圓角，呈現扁平、俐落的工具感，不是浮起的擬物風。
- **狀態色**：完成用 `--color-secondary` 系（深松綠），進行中用 `--color-primary` 系（蜂蜜金黃），未開始用中性 `--color-border` / `--color-ink-soft`。狀態卡片背景用對應的 soft 色，**邊框顏色也跟著換成該狀態的實色**（而非統一灰邊框），加強層級辨識。
- **按鈕**：primary 用金黃底 + 深色字（`var(--btn-primary-ink)`，不是白字，避免對比不足）+ 同色系邊框；secondary（完成/成功）用松綠底 + 白字；次要動作用 outline 風格（`--color-surface` 背景 + `--color-border-strong` 邊框）。點擊時 `transform: scale(0.97)` 作為觸覺回饋。
- **標籤/Pill/Chip/Label**：一律 `--radius-full` 完全圓角，字級 `--text-xs`，字重 700，**且一律大寫 + letter-spacing 0.04em**（`text-transform: uppercase`），強化工具感的資訊層級。中文標籤內容不受大寫影響，但搭配的英文/數字標記需套用此樣式。
- **數字**：金額、百分比、花費等數字一律用等寬字體 `var(--font-mono)`，與周圍中文黑體形成清楚的資訊區隔。
- **Modal**：用 `--radius-md` 7px（比卡片圓角略大，但仍銳利）+ 同樣的實邊框風格，不用陰影。
- **Toast/提示訊息**：深色實心背景（`var(--color-ink)` 底 + `var(--color-bg)` 文字）、`--radius-sm` 圓角、無陰影，短暫浮現後淡出，用於「已自動儲存」等輕量通知。

## 圖示規則

統一使用**線性描邊圖示**（stroke-width 約 1.8px、圓角線帽 `stroke-linecap="round"`），不使用系統 emoji 作為分類/狀態圖示。主要強調用的圖示（如分頁圖示）用 `var(--color-primary)` 上色；次要/中性圖示用 `var(--color-ink-soft)` 或 `var(--color-ink-faint)`。圖示參考範例都是內嵌 SVG（`viewBox="0 0 24 24"`），可以直接複製 `reference.html` 裡的 path 當作起點延伸畫新圖示，保持線寬和風格一致。

## 動效與 RWD 原則

- **動效**：只做必要的狀態轉換（顏色、邊框、transform），時長 `--duration` 0.15s（比一般設計略快，呼應工具感的俐落速度）、`--ease` cubic-bezier(.4,0,.2,1)。不加彈性/複雜動畫，也不用陰影變化做過場。
- **RWD**：手機優先設計，斷點 700px。手機版單欄堆疊、觸控目標加大（建議最小高度 42px）；桌機版限制內容最大寬度並置中（可參考現有 `app/src/base.css` 的 `.page` 寬度策略）。
- **深色模式**：透過 `[data-theme="dark"]` 覆寫上述 token，也支援 `prefers-color-scheme: dark` 媒體查詢跟隨系統（實作時需同時考慮兩種觸發路徑，可參考現有 `app/src/base.css` 的雙軌寫法）。

## 參考檔案

所有 token 的實際視覺效果（色票、字級、間距/圓角比例尺、按鈕/輸入框/標籤、卡片元件含 checkbox/連結變體、圖示組、Modal、Toast）都可以在同資料夾的 `reference.html` 裡直接用瀏覽器打開查看，右上角有深色模式切換按鈕可以對照兩種模式。
