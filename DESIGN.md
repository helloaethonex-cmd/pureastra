---
name: PureAstra
description: Gentle, plant-based skincare designed for Indian skin
colors:
  deep-ember: "#5E2B15"
  forest-sage: "#819744"
  warm-copper: "#8B543E"
  dark-olive: "#6F8438"
  cream-bg: "#FFFAED"
  taupe-surface: "#E9E2D8"
  warm-cream: "#FAF3E2"
  sand-border: "#E6D5C3"
  light-sage-bg: "#EBF1DC"
  ink: "#171717"
  ink-secondary: "#333333"
  ink-muted: "#555555"
typography:
  display:
    fontFamily: "DM Serif Display, Georgia, serif"
    fontSize: "clamp(2rem, 6vw, 3.5rem)"
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Amaranth, sans-serif"
    fontSize: "clamp(1.5rem, 4vw, 2.25rem)"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "normal"
  title:
    fontFamily: "Roboto Serif, Georgia, serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "normal"
  body:
    fontFamily: "Poppins, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.7
    letterSpacing: "normal"
  label:
    fontFamily: "Poppins, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.02em"
rounded:
  sm: "4px"
  md: "12px"
  xl: "20px"
  card: "25px"
  full: "9999px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
  section: "60px"
  section-lg: "80px"
  max-content: "1200px"
components:
  button-primary:
    backgroundColor: "{colors.deep-ember}"
    textColor: "#ffffff"
    rounded: "{rounded.sm}"
    padding: "12px 24px"
  button-primary-hover:
    backgroundColor: "{colors.forest-sage}"
  button-cart:
    backgroundColor: "{colors.forest-sage}"
    textColor: "#ffffff"
    rounded: "{rounded.full}"
    size: "40px"
  button-cart-hover:
    backgroundColor: "{colors.dark-olive}"
  button-icon:
    backgroundColor: "transparent"
    textColor: "{colors.warm-copper}"
    rounded: "{rounded.full}"
    size: "40px"
  button-icon-hover:
    backgroundColor: "{colors.warm-cream}"
---

# Design System: PureAstra

## 1. Overview

**Creative North Star: "The Botanist's Shelf"**

The PureAstra visual system is organized like a curated botanist's shelf: everything in its place, every ingredient with a purpose, nothing decorative. Warmth comes from materials, not embellishment. The palette anchors in terracotta and olive — colors that are botanical without being rustic, warm without being nostalgic, earthy without being generic.

Depth is achieved through transparency: glassmorphic layers of backdrop-blur and semitransparent backgrounds reveal surfaces in layers, the way light filters through a greenhouse. This is the system's signature treatment, appearing on product cards, the mobile drawer, and hover overlays. Drop shadows are used sparingly and only for floating UI.

The system explicitly rejects four failure modes from PRODUCT.md: the loud D2C brand (urgency mechanics, cluttered discount grids, neon banners); the cold luxury brand (intimidating distance, aloof minimalism); the generic Ayurvedic aesthetic (rustic earthy-brown overload, temple imagery, "ancient wisdom" framing); and corporate wellness sterility (soul-free whitespace, generic sans-serif uniformity). Everything here should feel human, specific to India, and grounded in genuine care.

**Key Characteristics:**
- Two botanical anchors: Deep Ember terracotta + Forest Sage olive. One leads per screen; they don't split equally.
- Glassmorphic surface treatment for depth — not drop shadows.
- Four-font system with clear role assignments: display, brand voice, product names, UI utility.
- Tactile and assured components: buttons have weight, states give immediate feedback.
- Flat surfaces at rest. Transparency + blur = depth in motion.

## 2. Colors: The Botanical Palette

The palette is built on two competing anchors. Every screen should feel resolved into one of them.

### Primary
- **Deep Ember** (`#5E2B15`): The brand's primary action color. Used on CTA buttons, navigation text, mobile active states, and primary icons. Warm, deep, and specific — not a generic brown. Earns its role by contrast and weight.

### Secondary
- **Forest Sage** (`#819744`): The secondary accent. Cart button background, swiper pagination, hover underlines on nav links, admin-facing highlights. Lives in the "botanical alive" register: green without being fresh, earthy without being dull.
- **Dark Olive** (`#6F8438`): Forest Sage's pressed/hover state. Never used at rest; only as a state response.

### Tertiary
- **Warm Copper** (`#8B543E`): Footer background and icon color on nav buttons. A mid-register between the primary terracotta and the neutral surfaces. Creates the footer's warm enclosure.

### Neutral
- **Cream Background** (`#FFFAED`): Body background. Warm but light — use sparingly as a body bg and never as the primary surface on content-heavy screens where it risks reading as the saturated AI default. The brand's warmth is carried by the primary and tertiary, not this neutral.
- **Taupe Surface** (`#E9E2D8`): Section-level background for alternating content blocks. Slightly cooler and more grounded than Cream Background.
- **Warm Cream** (`#FAF3E2`): Lighter warm surface for interactive hover states and the mobile drawer fill. More transparent than Cream Background.
- **Sand Border** (`#E6D5C3`): Stroke color for icon buttons and subtle dividers. Warm-neutral, never draws attention.
- **Light Sage** (`#EBF1DC`): Admin-context hover backgrounds only. Not used in the customer storefront.
- **Ink** (`#171717`): Primary text on light surfaces.
- **Ink Secondary** (`#333333`): Body prose text. The default for paragraph content.
- **Ink Muted** (`#555555`): Secondary and caption text. Must be verified at ≥4.5:1 against its background — this tone fails on Cream Background without checking.

**The Two-Anchor Rule.** Each screen is anchored in either Deep Ember or Forest Sage. The other appears as an accent at ≤30% of the surface. A screen that splits them 50/50 has no voice.

**The Warmth Carrier Rule.** Brand warmth is expressed by Deep Ember and Warm Copper, not by the Cream Background. Do not reach for a warm tinted neutral as a shortcut to make a screen feel botanical; use the actual brand colors.

## 3. Typography

**Display Font:** DM Serif Display (with Georgia, serif fallback)  
**Brand Voice Font:** Amaranth (sans-serif, italic weight)  
**Product Name Font:** Roboto Serif (with Georgia, serif fallback)  
**Body / UI Font:** Poppins (with system sans-serif fallback)

**Character:** Poppins handles all UI with clarity and efficiency; Amaranth carries the brand's philosophical voice in italic. The pairing is clear utility + warm conviction, not serif-plus-sans for the sake of it. Each font has a defined lane.

### Hierarchy
- **Display** (DM Serif Display, 400, `clamp(2rem, 6vw, 3.5rem)`, leading 1.1, tracking -0.02em): Hero headlines and section anchors. The brand's most authoritative type voice.
- **Headline** (Amaranth, 700, `clamp(1.5rem, 4vw, 2.25rem)`, leading 1.2): Section headings that carry brand philosophy — About, Promise, Routine sections. Always use Amaranth here, not Poppins.
- **Title** (Roboto Serif, 600, `1.125rem`, leading 1.3): Product names in cards and product detail pages. The serif quality reinforces craft and ingredient care.
- **Body** (Poppins, 400, `0.9375rem`, leading 1.7): All prose content. Max line length 65–75ch. Brand voice copy may use Amaranth italic at this size instead.
- **Label** (Poppins, 500, `0.75rem`, leading 1.4, tracking 0.02em): Navigation items, button labels, form labels, tags. Never Amaranth or Roboto Serif in label position.

**The Voice Rule.** Amaranth italic is the brand's written voice. It appears in copy that conveys philosophy, founder intent, or formulation narrative — not in UI labels, navigation, or form elements. Poppins is the utility voice. They should not compete; one leads the section, the other supports.

**The Display Ceiling.** Display headings are capped at 3.5rem (56px). Above that, the page shouts rather than invites. PureAstra does not shout.

## 4. Elevation

PureAstra is flat by default. Surfaces rest at the same visual plane; depth appears only in response to interaction or to separate floating UI.

The system's signature depth treatment is the **Botanical Glass**: `backdrop-blur-md` combined with a semitransparent background (`bg-*/20` to `bg-*/70%`), creating layered transparency that reveals content beneath. This appears on product card hover overlays, the mobile drawer, and the quick-action buttons on product images. It reads as botanical and honest rather than technological or decorative.

Drop shadows appear only on genuinely floating elements:
- Dropdown menus: `box-shadow: 0 4px 24px rgba(0,0,0,0.1)` — diffuse, ambient lift
- The WhatsApp FAB: `box-shadow: 0 4px 16px rgba(0,0,0,0.2)` — slightly stronger to separate from product images
- Icon button hover: `box-shadow: 0 2px 8px rgba(0,0,0,0.12)` — minimal state feedback

**The Botanical Glass Rule.** Depth on interactive surfaces comes from transparency and blur, not drop shadows. Hover reveals and mobile overlays use `backdrop-blur-md` + `bg-[color]/[opacity]`. Do not add `box-shadow` to these elements; the effect competes.

**The Shadow Ceiling Rule.** Drop shadows max out at `0 4px 24px` (4px Y, 24px blur). Heavier shadows belong on modals and drawers, not cards and buttons. Nothing uses a `box-shadow` blur radius above 24px at rest.

## 5. Components

Component philosophy: **tactile and assured**. Buttons feel like they have physical weight — a terracotta block with 4px radius, not a pill-shaped soft affordance. States give immediate feedback (instant color shift, 2px lift). Nothing floats decoratively.

### Buttons

**Primary CTA Button**
- Shape: Slightly curved corners (4px radius) — deliberate choice; not pill, not sharp
- Background: Deep Ember (`#5E2B15`); Poppins 500, `0.9375rem`, white text
- Padding: `12px 24px`
- Hover: background shifts to Forest Sage (`#819744`) + `translateY(-2px)` — immediate, tactile
- No border, no drop shadow; the color carries the authority
- Transition: `background 300ms, transform 300ms` with `ease-in-out`

**Icon Button (Nav: wishlist, user)**
- Shape: Circular (full radius)
- Background: Transparent; border `1px solid #E6D5C3`
- Color: Warm Copper (`#8B543E`)
- Size: 40px × 40px (36px on mobile)
- Hover: Background `#F5EFE9` + `scale-105` + shadow-md
- Focus: visible ring in Forest Sage

**Cart Button**
- Shape: Circular (full radius)
- Background: Forest Sage (`#819744`); white icon
- Size: 40px × 40px
- Hover: Dark Olive (`#6F8438`)
- Badge: Warm Copper (`#8B543E`) circle, `10px` white text, positioned `-top-1 -right-1`

### Product Cards

The system's signature component. Cards are image-forward with a glassmorphic hover reveal.

- Shape: 25px radius — the most rounded non-pill surface in the system. Softens the product image.
- Background at rest: `#D9D9D9` (neutral card bg; shows only before image loads)
- Rest state: Product image fills the card. Bottom bar shows name + price on a `bg-black/15 backdrop-blur-md` strip with `border-t border-white/15`.
- Hover state: Full-card overlay rises from bottom (`height: 0 → 100%`). `bg-gradient-to-t from-black/65 to-black/20 backdrop-blur-[10px]`. Product name + attribute tags appear with `translateY(20px) → 0 + opacity 0 → 1`, staggered at `150ms` per tag.
- Action buttons: `bg-white/25 backdrop-blur-md` circles, top-right corner, always visible.
- No outer border, no drop shadow on the card itself.
- **Never add `box-shadow` to the product card.** The glassmorphic hover is the depth treatment.

### Inputs / Fields

**Search Input (Navbar)**
- Style: Borderless except a `border-b-2 border-black` bottom stroke — the book-style underline input
- Background: Transparent
- No radius; flush with the line
- Text: Poppins 400, `0.875rem`
- Focus: The border-bottom color shifts to Deep Ember (`#5E2B15`); no outline ring
- Width: `150px` mobile, `220px` desktop

### Navigation

**Desktop Nav Links**
- Default: Poppins 500, `1.125rem`, Deep Ember text
- Hover: color shifts to Forest Sage + `translateY(-2px)` + underline slides in from left (`width: 0 → 100%`, `height: 2px`, Forest Sage, `300ms`)
- Icon: scales `1.1×` on hover independently of text
- No background treatment; purely typographic

**Mobile Drawer**
- Backdrop: `bg-[#FAF3E2]/70 backdrop-blur-md`
- Right-edge accent: Deep Ember gradient column, `80px` wide
- Menu items: `rounded-full`, height `56px`. Active = Deep Ember bg + `shadow-[0_4px_12px_rgba(0,0,0,0.2)]`; inactive = `bg-white/20 text-[#5E2B15] backdrop-blur-md`

### Footer

- Background: Warm Copper (`#8B543E`); white text — the brand's warm enclosure
- Brand text: Poppins 700, `1.5rem–1.875rem`
- Link text: Poppins 400, `0.875rem`, `#f1f1f1`
- Social icons: `text-lg`, scale `1.1×` on hover
- WhatsApp FAB: `#25D366` (WhatsApp brand color), `56px` circular, fixed `bottom-5 right-5`, `shadow-lg`

### Product Hover Tags

- Shape: 20px radius pill
- Background: `bg-white/25` (glassmorphic)
- Text: Poppins 400, `0.875rem`, `#D9D9D9`
- Entrance: staggered `translateY(20px) → 0` + `opacity 0 → 1`, `150ms` delay per tag

## 6. Do's and Don'ts

### Do:
- **Do** use Deep Ember (`#5E2B15`) as the default CTA color on every primary action. Forest Sage is the accent, not a second primary.
- **Do** use backdrop-blur + semitransparent backgrounds for depth on interactive surfaces. This is PureAstra's signature glassmorphic layer.
- **Do** use Amaranth italic for brand-voice copy sections (About, Promise, philosophy paragraphs) and Poppins for all UI labels and navigation.
- **Do** verify Ink Muted (`#555555`) against Cream Background — it can fail 4.5:1. Darken to `#444` or switch to Ink Secondary if contrast doesn't pass.
- **Do** keep product card hover reveals as the primary product detail mechanism. The 150ms staggered entrance is part of the brand feel.
- **Do** apply `text-wrap: balance` to Display and Headline text, and `text-wrap: pretty` to Body prose to eliminate orphaned words.
- **Do** include `@media (prefers-reduced-motion: reduce)` alternatives for all card reveal animations, the nav underline slide, and any scroll-driven sequences — use crossfade/instant transitions as alternatives.
- **Do** cap body prose at 65–75ch line length. The current copy in sections like About risks line lengths that exceed readable limits on large viewports.

### Don't:
- **Don't** use loud D2C patterns: urgency banners ("Only 3 left!"), neon sale badge overlays, or cluttered "bestseller/top-rated" grid labels. These are the Mamaearth failure mode PRODUCT.md names explicitly.
- **Don't** use cold luxury styling: excessive whitespace that creates distance, type-only hero sections with no warmth, or pricing that emphasizes scarcity over trust.
- **Don't** default to generic Ayurvedic aesthetic: rustic texture backgrounds, temple or herb imagery as decorative chrome, or "ancient wisdom" taglines. The brand is contemporary and formulation-forward.
- **Don't** add a second font family that isn't in the four established roles (DM Serif Display / Amaranth / Roboto Serif / Poppins). Five loaded fonts are already stretching the system; a sixth is never justified.
- **Don't** pair a `border` stroke with a large `box-shadow` blur (≥16px) on the same element. This is the ghost-card pattern — pick one.
- **Don't** use `border-radius` above 25px on cards or sections. The product card is already at the maximum. Above this it reads as over-rounded with no brand reason.
- **Don't** put `box-shadow` on product cards. The glassmorphic hover is the depth system; a shadow underneath competes and dulls the effect.
- **Don't** use the Cream Background (`#FFFAED`) as the default answer for "make this feel warm." Use Deep Ember or Warm Copper directly. The cream bg is a neutral, not a warmth carrier.
- **Don't** use gradient text (`background-clip: text` + gradient). PureAstra's voice is direct; gradient text is decoration, never meaning.
- **Don't** use a side-stripe border (`border-left` or `border-right` > 1px) as a card or callout accent. Use full borders, background tints, or icon anchors instead.
