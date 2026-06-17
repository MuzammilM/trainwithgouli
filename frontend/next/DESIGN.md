# Design: TrainWithGouli

## Direction
Brutalist web design: raw structure, high contrast, system and monospace fonts, bold black borders, hard shadows, no gradients, no rounded corners beyond what the browser default provides.

## Visual language
- **Background**: off-white `#f7f7f5` (light), near-black `#0a0a0a` (dark).
- **Foreground**: near-black `#0a0a0a` (light), off-white `#f7f7f5` (dark).
- **Accent**: warning orange `#ff3b00` for hover states and highlights.
- **Typography**: system sans for UI, `Geist Mono` / monospace for data and notes.
- **Borders**: 2px solid foreground on cards, inputs, buttons, nav.
- **Shadows**: hard offset shadow `4px 4px 0 0 foreground` on hover cards only.

## Components
- **Buttons**: rectangular, 2px border, uppercase bold text, inverted colors for primary.
- **Inputs**: rectangular, 2px border, no border-radius.
- **Cards**: 2px border, no border-radius, generous padding.
- **Nav**: bottom border, large uppercase logo.

## Accessibility
- Focus-visible ring in accent color.
- Color contrast exceeds WCAG AA.
- Semantic HTML and form labels.
