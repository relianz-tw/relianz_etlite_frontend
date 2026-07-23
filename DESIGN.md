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

### Form Inputs
```
Border: 1.5px solid #9AA7B9
Border-radius: 6px
Padding: 10px 14px
Font: Baskerville Regular / Noto Sans TC, 16px
Focus border: #005FA2
Focus shadow: 0 0 0 3px rgba(0, 95, 162, 0.15)
Error border: #377456 inverted → use a warm red if needed; default to 權威灰 `#3A3830`
```

### Navigation
```
Font: Baskerville Semibold / Noto Serif TC, 18px
Color: #3A3830
Active / hover: #005FA2
Background: #FFFFFF with 1px bottom border #EAE5E3
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

| Name | Width | Notes |
|------|-------|-------|
| Mobile | < 480px | Single column, stacked CTA |
| Mobile L | 480–720px | Standard mobile |
| Tablet | 720–1024px | 2-column layouts |
| Desktop | 1024–1280px | Standard desktop |
| Large | 1280–1920px | Full layout, max-width container |

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
