# Brand detection

The whole point of this skill over the raw template is that the screenshots
should look like they belong to the app — same name, icon, fonts, and colors —
without interrogating the user. Pull these from the app's own source. Treat
every finding as a proposal and show the user what you detected before
committing; a wrong accent color is obvious and cheap to fix.

## 1. App name + icon

Look at the app's config, in priority order:

- **Expo / React Native:** `app.json` / `app.config.js` / `app.config.ts` →
  `expo.name` (display name) and `expo.icon` (usually `./assets/images/icon.png`).
  `expo.ios.icon` overrides on iOS if present.
- **Bare iOS (Swift):** `*/Info.plist` → `CFBundleDisplayName` (fallback
  `CFBundleName`); icon under `Assets.xcassets/AppIcon.appiconset/` (grab the
  largest PNG).
- **Flutter:** `pubspec.yaml` → `name`; icon under
  `ios/Runner/Assets.xcassets/AppIcon.appiconset/`.

Copy the icon to `<app>-screenshots/public/app-icon.png` and set `appName` +
`appIcon` in the project JSON.

## 2. Fonts

Apps usually ship two faces: a **display** font for headings/buttons and a
**body** font for everything else. Marketing headlines should use the display
font; the small eyebrow label looks right in the body/mono font.

Find them:

```bash
# Which font families the app actually uses, and for what:
grep -rniE "fontFamily" src app 2>/dev/null | grep -v node_modules
# The font files themselves:
find . -path ./node_modules -prune -o \( -iname "*.ttf" -o -iname "*.otf" \) -print
```

Heuristics:
- The family used on titles/headers/buttons (e.g. wrapped around screen titles,
  CTA `ButtonText`) is the **display** font.
- The family used on labels/list rows/body copy is the **body** font.
- If only one custom font exists, use it for the display role and fall back to a
  neutral system font for the body.
- Many card-game / playful apps use an all-caps display face (e.g. a "Card" or
  slab font). That's fine and on-brand — don't fight it by forcing lowercase.

Copy the `.ttf`/`.otf` files into `<app>-screenshots/public/fonts/` and wire
them up per `template-customization.md`.

## 3. Colors

Build a 6-token theme `{ bg, bgAlt, fg, fgAlt, accent, muted }`. The accent is
the most important and the most recoverable — it's the app's primary CTA color.

```bash
# Hunt for the CTA / accent and surface colors:
grep -rniE "#[0-9a-fA-F]{6}" src app 2>/dev/null | grep -v node_modules \
  | grep -iE "button|cta|primary|accent|brand|background|splash|tint|link"
# Tailwind/NativeWind arbitrary values like bg-[#26ABFF] also count.
```

Also check:
- Splash / launch background (`expo.splash.backgroundColor`, `app.json`) — often
  the app's dark surface; good `bgAlt`.
- iOS asset catalog `AccentColor.colorset` if present.
- A theme/tokens/colors file if the app has one.

Map to tokens (a sensible default that matches most clean iOS apps):
- `accent` = primary CTA / button color (the one thing that must be right).
- `bg` = the app's light screen background. If it's near-white, nudge to a soft
  off-white/gray (e.g. `#F2F2F5`) — flat pure white reads as unfinished.
- `bgAlt` = the app's dark surface (splash/black) for the inverted slides.
- `fg` = near-black (`#0A0A0A`); `fgAlt` = white.
- `muted` = a mid gray (`#6B7280`).

The eyebrow label renders in `accent`, so each slide's feature name pops in the
brand color automatically — that's how features get "highlighted" without extra
elements.

## When detection is thin

If the app has no custom fonts or an unclear palette, say so and either (a) ask
the user for a hex + vibe, or (b) start from one of the template's built-in
presets (`clean-light`, `dark-bold`, `warm-editorial`, `ocean-fresh`,
`bloom-roast`) and the `references/style-prompts/` deep specs. Don't silently
invent a brand and present it as detected.
