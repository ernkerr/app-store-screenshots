# Template customization

After copying `template/` into `<app>-screenshots/`, make these edits to wire in
the detected brand. Line numbers drift between template versions — match on the
surrounding code, not the line number. Verify every edit visually in an export;
the headless export (`scripts/export-bundle.cjs`) is the ground truth, not the
on-screen preview.

## 1. Brand theme → `src/lib/constants.ts`

Add one entry at the top of the `THEMES` object and reference it by id from the
project JSON (`"themeId": "<app>-brand"`):

```ts
"<app>-brand": {
  id: "<app>-brand",
  name: "<App> (detected)",
  bg: "#F2F2F5",      // light surface (non-inverted slides)
  bgAlt: "#000000",   // dark surface (inverted slides)
  fg: "#0A0A0A",      // headline on light
  fgAlt: "#FFFFFF",   // headline on dark
  accent: "#26ABFF",  // CTA color — eyebrow labels + decorations
  muted: "#6B7280",
},
```

## 2. Brand fonts → `public/fonts/` + `src/app/globals.css`

Copy the app's font files into `public/fonts/`, then add `@font-face` blocks at
the top of `globals.css` (just after the `@tailwind` lines):

```css
@font-face {
  font-family: "Display";              /* the app's heading face */
  src: url("/fonts/<DisplayFont>.ttf") format("truetype");
  font-weight: 100 900;
  font-display: block;
}
@font-face {
  font-family: "Body";                 /* the app's body/mono face */
  src: url("/fonts/<BodyFont>-Regular.ttf") format("truetype");
  font-weight: 400; font-display: block;
}
/* add a second @font-face for the bold body weight if the app ships one */
```

`font-display: block` matters — it avoids a flash of fallback font that could be
captured mid-swap during export.

## 3. Apply fonts → `src/components/editor/slide-canvas.tsx`

In the `Caption` component, the **headline** `EditableText` style gets the
display font and the **label** style gets the body font:

```ts
// headline style — add:
fontFamily: '"Display", system-ui, sans-serif',
// label style — add:
fontFamily: '"Body", ui-monospace, monospace',
```

If the app's display font is single-weight, leave `fontWeight` as-is; the browser
synthesizes weight and it still reads on-brand.

## 4. Flatten the look (most apps want this)

The template ships subtle gradients + blurred "glow" blobs. Real app screens are
flat, so unless the brand is explicitly gradient-heavy, flatten:

- **Kill the glow:** make the `Blob` component `return null;` (one edit, removes
  every decorative blob at once).
- **Flat backgrounds:** in `backgroundFor`, return the solid token instead of a
  gradient: `return inverted ? theme.bgAlt : theme.bg;`

## 5. Seed the deck → `app-store-screenshots.json`

Five slides is the sweet spot. Lead with the strongest "app doing its job" shot,
follow with the killer feature, vary layouts, use 1–2 inverted slides for rhythm.
Each `label` is a feature name (renders in accent), each `headline` is one idea,
2–4 words per line, line breaks are intentional.

```json
{
  "schemaVersion": 2,
  "appName": "<App>",
  "themeId": "<app>-brand",
  "connectedCanvas": false,
  "locales": ["en"], "locale": "en",
  "device": "iphone", "orientation": "portrait",
  "appIcon": "/app-icon.png",
  "slidesByDevice": {
    "iphone": [
      { "id": "s1", "layout": "hero",          "label": {"en":"<APP NAME>"},   "headline": {"en":"<benefit>\n<line2>"}, "screenshot": "/screenshots/apple/iphone/en/01.png" },
      { "id": "s2", "layout": "device-top",    "label": {"en":"<FEATURE>"},    "headline": {"en":"<feature line>"},     "screenshot": "/screenshots/apple/iphone/en/02.png", "inverted": true },
      { "id": "s3", "layout": "device-bottom", "label": {"en":"<FEATURE>"},    "headline": {"en":"..."},                "screenshot": "/screenshots/apple/iphone/en/03.png" },
      { "id": "s4", "layout": "device-top",    "label": {"en":"<FEATURE>"},    "headline": {"en":"..."},                "screenshot": "/screenshots/apple/iphone/en/04.png", "inverted": true },
      { "id": "s5", "layout": "device-bottom", "label": {"en":"<FEATURE>"},    "headline": {"en":"..."},                "screenshot": "/screenshots/apple/iphone/en/05.png" }
    ],
    "ipad": [ /* same shape, screenshots under /screenshots/apple/ipad/en/ */ ],
    "android": [], "android-7": [], "android-10": [], "feature-graphic": []
  },
  "crossScreenMockupsByDevice": { "iphone": [], "ipad": [], "android": [], "android-7": [], "android-10": [], "feature-graphic": [] }
}
```

Layouts available: `hero`, `device-bottom`, `device-top`, `two-devices`,
`no-device`, `split-landscape` (tablet landscape only), `feature-graphic`. Don't
repeat a layout on adjacent slides.

## Gotchas learned the hard way

- **`/api/project` wraps state:** the GET returns `{ ok, state: {...} }`, not the
  bare project. Read `.state`.
- **Export = a real browser download.** It's a blob `<a download>` click, so you
  must capture it via CDP `Page.setDownloadBehavior` (the script does this), not
  by reading a return value.
- **Fonts must be loaded before export** or html-to-image embeds nothing and the
  headline silently falls back. Await `document.fonts.ready` first.
- **Headless Chrome has no localStorage**, which is why setting `device` in the
  JSON before a fresh load reliably switches decks. In a *human* browser,
  localStorage mirrors state — switch device via the toolbar instead.
- **zsh arrays are 1-indexed.** A `for i in 0 1 2 3 4` loop over a bash-style
  array silently drops an item in zsh. Use explicit `cp` lines or bash.
- **Source screenshots should be RGB**, not RGBA — transparent pixels export as
  black rectangles.
- Required source capture sizes don't matter much; the editor re-renders into
  every export size. But capture at native device resolution for crispness.

## Advanced (Android, localization, cross-screen, deep style specs)

This skill's SKILL.md covers the brand-aware iOS iPhone+iPad flow. For Android
decks, multi-locale, connected-canvas cross-screen composition, the feature
graphic, and the named deep-spec art styles, defer to
`references/upstream-skill.md` (the original ParthJadhav skill) and
`references/style-prompts/`.
