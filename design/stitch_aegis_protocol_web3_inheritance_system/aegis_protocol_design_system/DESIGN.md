---
name: Aegis Protocol Design System
colors:
  surface: '#f8f9fa'
  surface-dim: '#d9dadb'
  surface-bright: '#f8f9fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f5'
  surface-container: '#edeeef'
  surface-container-high: '#e7e8e9'
  surface-container-highest: '#e1e3e4'
  on-surface: '#191c1d'
  on-surface-variant: '#3e4850'
  inverse-surface: '#2e3132'
  inverse-on-surface: '#f0f1f2'
  outline: '#6e7881'
  outline-variant: '#bec8d2'
  surface-tint: '#006591'
  primary: '#006591'
  on-primary: '#ffffff'
  primary-container: '#0ea5e9'
  on-primary-container: '#003751'
  inverse-primary: '#89ceff'
  secondary: '#505f76'
  on-secondary: '#ffffff'
  secondary-container: '#d0e1fb'
  on-secondary-container: '#54647a'
  tertiary: '#006c49'
  on-tertiary: '#ffffff'
  tertiary-container: '#00b17b'
  on-tertiary-container: '#003b26'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#c9e6ff'
  primary-fixed-dim: '#89ceff'
  on-primary-fixed: '#001e2f'
  on-primary-fixed-variant: '#004c6e'
  secondary-fixed: '#d3e4fe'
  secondary-fixed-dim: '#b7c8e1'
  on-secondary-fixed: '#0b1c30'
  on-secondary-fixed-variant: '#38485d'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#f8f9fa'
  on-background: '#191c1d'
  surface-variant: '#e1e3e4'
typography:
  display:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-mono:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.4'
  caption:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
---

## Brand & Style

The design system is engineered for a premium Web3 digital inheritance platform, prioritizing trust, security, and technological sophistication. The brand personality is "The Secure Guardian"—a blend of modern fintech reliability and futuristic accessibility. 

The aesthetic draws from **Modern Corporate** and **Glassmorphism**, utilizing high-contrast layouts, expansive whitespace, and translucent layering to create a sense of depth and clarity. The goal is to make the complex concept of digital asset inheritance feel effortless, safe, and elite. The interface should evoke a sense of calm and institutional-grade security, moving away from the chaotic visuals often associated with crypto.

## Colors

This design system utilizes a pristine, high-luminance palette to establish an atmosphere of transparency and trust.

- **Primary (Azure/Cyan):** Used for primary actions, focus states, and the core brand signature. Often applied as a soft gradient.
- **Secondary (Slate):** Employed for supporting text, icons, and non-critical UI elements to maintain a professional, grounded tone.
- **Tertiary (Emerald):** Reserved exclusively for success states, security confirmations, and "protected" indicators.
- **Neutral (Gray/White):** A scale of cool grays provides the foundation. Backgrounds are pure white (#FFFFFF), with surfaces and containers utilizing a soft off-white (#F9FAFB) to define boundaries without harsh lines.
- **Accent (Amber):** A soft amber is used sparingly for time-sensitive countdowns or "action required" legacy triggers.

## Typography

The typography system focuses on extreme legibility and a systematic hierarchy. **Inter** is the workhorse font, providing a clean, neutral, and modern feel. For display headings, tight tracking (letter-spacing) is applied to create a premium, editorial look similar to high-end SaaS tools.

**JetBrains Mono** is introduced specifically for blockchain-related data: wallet addresses, transaction hashes, and smart contract parameters. This distinction helps users mentally separate "content" from "technical data," reinforcing the platform's Web3 identity.

## Layout & Spacing

This design system follows a **fixed-fluid hybrid grid**. Content is centered within a 1280px container on desktop, while margins and gutters expand fluidly on smaller viewports. 

- **Spacing Rhythm:** Based on an 8px baseline grid to ensure mathematical harmony across all components.
- **Desktop:** 12-column grid with 24px gutters. Large internal padding (32px+) within cards to emphasize a "premium" feel.
- **Mobile:** 4-column grid with 16px margins.
- **The Sidebar:** A fixed 280px width sidebar on desktop, transitioning to a bottom-sheet or hidden drawer on mobile.
- **Top Navigation:** A sticky 72px height bar utilizing backdrop-blur for a glassmorphic effect.

## Elevation & Depth

Hierarchy is established through **glassmorphism** and **multi-layered ambient shadows**. 

- **Level 0 (Background):** Pure #FFFFFF.
- **Level 1 (Cards/Surfaces):** #F9FAFB with a 1px border (#F1F5F9).
- **Level 2 (Modals/Overlays):** Utilizes "Glass" effect—semi-transparent white (#FFFFFF80) with a 12px backdrop-blur and a soft, wide-spread shadow (0px 20px 50px rgba(0,0,0,0.04)).
- **Shadow Profile:** Shadows are never black; they use a faint blue tint (e.g., `rgba(14, 165, 233, 0.05)`) to maintain the airy, azure-themed aesthetic.

## Shapes

The shape language is defined by oversized, friendly, yet precise radii. The "2xl" roundedness (1.5rem / 24px) is the primary signature for cards and main containers, signaling a modern, approachable fintech vibe.

- **Standard Elements (Inputs/Buttons):** 0.5rem (8px).
- **Cards & Containers:** 1.5rem (24px).
- **Status Pills:** Fully rounded (9999px).

## Components

### Buttons
- **Primary:** Features a subtle linear gradient from #0EA5E9 to #0284C7. White text, 1px inset top border for a "tactile" feel.
- **Secondary/Ghost:** Transparent background with a 1px border (#E2E8F0). Focus state adds a soft azure glow.
- **Wallet Connect:** A specific variant using a blurred background and a left-aligned icon for the specific chain/provider.

### Cards
- Large 24px corners.
- 1px border (#F1F5F9).
- Subtle "hover" lift effect where the shadow deepens and the border color shifts to #0EA5E9 at 30% opacity.

### Inputs
- Background: #FFFFFF.
- Border: #E2E8F0.
- Focus State: Border color shifts to #0EA5E9 with a 4px outer "glow" (spread shadow) in the same color at low opacity.

### Tables
- No vertical borders.
- 16px vertical padding on rows.
- Hover state: Row background changes to #F9FAFB.
- Status Indicators: Small dots with a "pulse" animation for active protocols.

### Navigation
- **Sidebar:** Minimal icons with #64748B (Slate) color, shifting to Primary Blue on active states with a vertical indicator bar.
- **Top Nav:** Sticky, 70% opacity white background, 16px backdrop-blur, and a subtle bottom border.