# Trippy-Tropa — Interface System

## Direction

**Feel:** Calm, professional academic SaaS — structured like a campus portal, not a marketing site. Dense enough for tasks and classrooms; breathable spacing for focus.

**User:** Students and teachers juggling group projects between classes.

**Signature:** Consistent **Trippy-Tropa** brand mark (graduation cap in primary blue) + single blue accent (`#004ac6`) on warm off-white canvas (`#faf8ff`).

## Typography

- **Family:** Plus Jakarta Sans (Google Font) — body and headings
- **Never use** `font-serif` (avoids Times New Roman fallback on Windows)
- **Headings:** `font-heading`, `tracking-tight`, weight 600–700
- **Body:** `font-sans`, 14–16px, `#191b23` / `#434655` hierarchy

## Color (Stitch palette)

| Token | Hex | Use |
|-------|-----|-----|
| Primary | `#004ac6` | Brand, links, active nav |
| Primary button | `#2563eb` | CTAs |
| Background | `#faf8ff` | Page canvas |
| Surface | `#ffffff` | Cards, headers |
| Border | `#c3c6d7` | Subtle separation |
| Text primary | `#191b23` | Headlines |
| Text secondary | `#434655` / `#505f76` | Supporting copy |

## Depth

- **Strategy:** Borders-only + whisper shadows on cards
- **Shadow:** `0 1px 3px rgba(0,0,0,0.05)` default; hover lift on classroom cards
- **Sidebars:** Same white as content; `border-r` separation (no gray sidebar slab)

## Spacing

- Base unit: **4px**; sections **16–24px**; page padding **16–32px**
- Card padding: **16px** (`p-4`) standard

## Components

- **Brand:** `BrandMark`, `BrandTitle` from `@/components/brand/brand-mark`
- **Constants:** `APP_NAME`, `APP_TAGLINE` from `@/lib/constants/brand`
- **Page headers:** Sticky white bar, `h-16`, border `#c3c6d7`

## Radius

- Inputs/buttons: `rounded-lg` (8px)
- Cards: `rounded-xl` (12px)
- Brand icon container: `rounded-xl`
