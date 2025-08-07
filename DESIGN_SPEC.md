# Mobile Wallet Design Specification

## Aesthetic & Materials
- Luxury fintech + modern Apple-like minimalism
- Matte black and deep charcoal surfaces with subtle brushed metal textures
- Gold accents for highlights and primary CTAs; very restrained glow
- Soft shadows, realistic depth, polished edges, no skeuomorphism overload

## Color Palette (exact)
- **Background**: #0B0D10
- **Surface / Cards**: #121417, #151A1E
- **Primary Accent (Gold)**: #D4AF37 (hover/alt: #C8A959)
- **Secondary Accent (Solana gradient—sparingly)**: #9945FF → #14F195 → #00FFA3
- **Text**: 
  - Primary #E6E9EF
  - Secondary #9AA3AF
  - Muted #6B7280
- **Status**: 
  - Success #18C29C
  - Warning #F59E0B
  - Error #F43F5E
- **Dividers/Hairlines**: rgba(255,255,255,0.06)

## Iconography
- **Central motif**: minimal **vault** symbol (geometric door + subtle radial latch)
- **Supporting**: lightning (speed), shield (security), arrows (send/receive), QR
- Line icons, 2px stroke, optically balanced, no cartoonish glyphs

## Layout & Grid
- 12-column grid, 1440px desktop canvas
- 8px spacing system; card radius 16–20px
- Generous negative space; clear hierarchy

## Typography
- **Headings**: SF Pro / Inter / Söhne Grotesk vibe (modern, neutral)
- **Body**: Inter 14–16px, 1.6 line-height
- Numbers use tabular lining for balances
- Never all-caps for long labels; title case only

## UX Principles
- Smart UX: suggest fast/eco fee tiers, humanized confirmations
- Balance privacy with clarity: "Stealth mode" blurs balances
- One-click copy, QR receive, .sol name support
- Minimal friction: single prominent primary action per screen

## Motion & Micro-interactions
- 150–250ms ease; micro glints on gold accents
- Vault icon rotates 10–15° when unlocking (subtle)
- Success toasts slide in with light gold shimmer

## Accessibility
- WCAG AA contrast; keyboard focus rings (thin gold outline)
- Large touch targets; clear error copy

## Tone
- Rebellious, confident, respectful: "No branches. No forms. No nonsense."
- Footer (optional): "Our vault opens faster than their doors ever will."

## Negative Prompts
- No cartoon, no gradients overload, no neon clutter, no glassmorphism soup
- No busy backgrounds, no crypto clichés (rockets/apes), no fake 3D coins