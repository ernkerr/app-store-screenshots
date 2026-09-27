---
name: app-store-screenshots
description: >-
  Generate polished, on-brand App Store marketing screenshots (iPhone + iPad)
  for an app, using a bundled Next.js screenshot-editor template. Auto-detects
  the app's name, icon, fonts, and colors from its source so the slides match
  the real app, scaffolds a sibling <app>-screenshots project, builds a 5-slide
  deck, and headless-exports every required size to the Desktop. USE THIS
  whenever the user wants App Store / Play Store / store-listing screenshots,
  marketing screenshots, app preview images, or "screenshots for the app store"
  — even if they just point at an app repo and say "make screenshots for this."
  Trigger on: app store screenshots, marketing assets, store listing images,
  app preview, screenshot editor, iPhone/iPad screenshots, phone mockup.
---

# App Store screenshots (brand-aware)

## What this does

App Store screenshots are **advertisements, not UI documentation** — each one
sells one idea with a big headline, a framed device, and the app's own look.
This skill turns raw simulator captures into a store-ready deck that matches the
app's brand, then exports the exact pixel sizes Apple requires.

The rendering engine is a pre-built Next.js + shadcn editor in `template/` (the
ParthJadhav screenshot editor — do **not** rebuild it). The value this skill
adds on top: **auto-detecting the app's brand** and **headless-exporting to the
Desktop** so the user barely has to touch the browser.

## What you produce

A `<app>-screenshots/` folder next to the app repo, plus on the user's Desktop:
- `iPhone 6.9 (primary)/` — 5 slides at 1320×2868
- `iPhone all-sizes/` — 6.9 / 6.5 / 6.3 / 6.1"
- `iPad 13in (primary)/` — 5 slides at 2064×2752
- `iPad all-sizes/` — 13" + 12.9"
- the raw `*-bundle.zip`s

## Prerequisites (check, don't assume)

- `bun` (preferred) or `npm`. - Google Chrome (for headless export).
- macOS iOS Simulator (`xcrun simctl`) if you'll capture screens.
- The capturing step is manual for React Native / Flutter / non-Swift apps —
  the app has to be driven to each screen by a human or the simulator. Only
  bare iOS-Swift apps can use ParthJadhav's `ios-marketing-capture` companion.

## Workflow

Work through these in order. Keep the user in the loop at Step 1 (show detected
brand) and Step 3 (confirm which screens) — everything else can be autonomous.

### Step 0 — Locate the app

The target app is usually the current working directory (or the user names it).
Confirm it's an app repo (has `app.json`/`Info.plist`/`pubspec.yaml`). The
screenshots project goes in a **sibling** folder `<app>-screenshots/`, never
inside the app repo (it's a whole Next.js app and would pollute the repo).

### Step 1 — Detect the brand

Read `references/brand-detection.md` and pull the app's **name, icon, display
font, body font, and color palette** from its own source. Build a 6-token theme
`{ bg, bgAlt, fg, fgAlt, accent, muted }` — `accent` = the primary CTA color is
the one that must be right. Briefly tell the user what you detected (e.g. "Card
+ SpaceMono fonts, blue #26ABFF accent, black splash") before proceeding. Don't
invent a brand and present it as detected — if it's thin, ask or use a preset.

### Step 2 — Scaffold + brand the project

```bash
SKILL="$HOME/.claude/skills/app-store-screenshots"
DEST="<...>/<app>-screenshots"
mkdir -p "$DEST" && cp -R "$SKILL/template/." "$DEST/"
cp "<app icon>" "$DEST/public/app-icon.png"
cd "$DEST" && bun install          # or npm install
bun add -d puppeteer-core          # headless export driver
```

Then apply the brand per `references/template-customization.md`:
- add the `<app>-brand` theme to `src/lib/constants.ts`
- copy the app's fonts into `public/fonts/` and `@font-face` them in `globals.css`
- point the headline at the display font and the eyebrow label at the body font
  in `src/components/editor/slide-canvas.tsx`
- flatten the glow + gradients unless the brand is gradient-heavy

### Step 3 — Get the screenshots

Ask the user if they already have captures. If not, you capture/guide:

```bash
# the app is an Expo/RN app -> build & boot once, then drive it
cd <app repo> && npx expo run:ios        # builds ios/, installs on a booted sim
# reuse the same simulator build on an iPad without rebuilding:
xcrun simctl boot "<iPad UDID>"; open -a Simulator
xcrun simctl install "<iPad UDID>" "<DerivedData>/.../<App>.app"
xcrun simctl launch  "<iPad UDID>" "<bundle id>"
```

You generally **cannot** programmatically tap a React Native app (no `idb`), so
have the user press **⌘S** in the Simulator on each screen (saves a PNG to the
Desktop). Tell them exactly which 4–5 screens to grab, chosen to sell the app:
1. the app doing its core job, populated with real data (the hero)
2. the killer/differentiator feature
3. setup / personalization
4. depth — another core feature
5. the list/continue/"pick up anytime" screen

Place captures as zero-padded PNGs:
`public/screenshots/apple/iphone/en/01.png … 05.png` and the iPad equivalents
under `.../apple/ipad/en/`. Flatten to RGB if any are RGBA.

### Step 4 — Build the deck

Seed `app-store-screenshots.json` with a 5-slide iPhone deck and a parallel iPad
deck per the template in `references/template-customization.md`. Order for
impact (strongest shot as the hero, not capture order), vary layouts across
adjacent slides, mark 1–2 slides `"inverted": true` for rhythm, and make each
`label` a feature name (it renders in the accent color, which is how features
get highlighted). Headlines: one idea each, 2–4 words per line, deliberate line
breaks.

### Step 5 — Export to the Desktop

Start the editor, then run the headless exporter once per device:

```bash
cd "$DEST" && PORT=3000 bun dev &                       # leave running
# wait for http://localhost:3000 to return 200, then:
node "$SKILL/scripts/export-bundle.cjs" --project "$DEST" --device iphone
node "$SKILL/scripts/export-bundle.cjs" --project "$DEST" --device ipad
```

If port 3000 is already taken (another project's dev server), `bun dev` fails
with EADDRINUSE while the exporter silently loads the *other* app and times
out waiting for "Export bundle". Check with `lsof -iTCP:3000 -sTCP:LISTEN`,
then run `bun dev --port <free>` and pass `--port <free>` to the exporter.

Each prints `ZIP:<path>`. Unzip and copy onto the Desktop in the structure under
"What you produce". The primary iPhone size lives at `ios/iphone/1320x2868/en/`,
the primary iPad at `ios/ipad/2064x2752/en/`. Restore `"device": "iphone"` in the
JSON afterward so the live editor opens on iPhone.

### Step 6 — Verify + deliver

Open 2–3 exported PNGs and actually look: brand fonts rendered (not a fallback),
accent color right, no glow, screenshots seated in the frame, headlines not
clipped. Surface the finished slides to the user (e.g. `SendUserFile`). Mention
the live editor URL so they can tweak copy/layout and re-export.

**Next:** the `app-store-connect-setup` skill (sibling folder) creates the App
Store Connect listing and uploads these Desktop folders to it.

## Editing after the first pass

The deck auto-saves to `app-store-screenshots.json`. To change copy/colors,
edit that file or the theme and re-run Step 5. The user can also drag-edit in the
browser at `localhost:3000`.

## Going further

`references/upstream-skill.md` + `references/style-prompts/` cover Android decks,
multi-locale, cross-screen composition, the Play feature graphic, and named
deep-spec art styles. Pull from there when the user asks for any of those.
