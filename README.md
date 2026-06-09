# app-store-screenshots

A [Claude Code](https://claude.com/claude-code) **skill** that generates polished,
on-brand **App Store marketing screenshots** (iPhone + iPad) for an app — then
headless-exports every required size to your Desktop.

What makes it more than the underlying template: it **auto-detects the app's
brand** (name, icon, display + body fonts, accent/surface colors) straight from
the app's own source, so the marketing slides actually look like the app —
without an interview.

## Install

```bash
npx skills add ernkerr/app-store-screenshots
```

Or clone into your skills directory:

```bash
git clone https://github.com/ernkerr/app-store-screenshots \
  ~/.claude/skills/app-store-screenshots
```

## Use

From your app's repo, just ask Claude Code:

> make app store screenshots for this app

It will:

1. **Detect the brand** — name + icon (`app.json` / `Info.plist` / `pubspec.yaml`),
   fonts (`assets/fonts` + `fontFamily` usage), colors (CTA / accent / splash).
2. **Scaffold** a sibling `<app>-screenshots/` Next.js editor, branded automatically.
3. **Guide capture** — boots the iOS simulator and tells you exactly which screens
   to grab (capture is manual for React Native / Flutter; auto for bare iOS-Swift).
4. **Build a 5-slide deck** — strongest shot as hero, feature eyebrows in the
   accent color, varied layouts, dark slides for rhythm.
5. **Export to your Desktop** — iPhone 6.9/6.5/6.3/6.1" + iPad 13"/12.9",
   via a headless Chrome driver, as store-ready PNGs + zips.

You can keep editing live in the browser (`localhost:3000`) and re-export.

## Layout

```
SKILL.md                 # workflow + triggering
template/                # the Next.js + shadcn screenshot editor (rendering engine)
scripts/export-bundle.cjs# headless export → zip (puppeteer-core + system Chrome)
references/
  brand-detection.md     # how to pull fonts/colors/name/icon per framework
  template-customization.md # exact theme/font/glow edits + gotchas
  upstream-skill.md      # Android, localization, cross-screen, deep style specs
  style-prompts/         # named art-style specs
```

## Credit & license

The screenshot-editor `template/` and the deep style specs come from
[ParthJadhav/app-store-screenshots](https://github.com/ParthJadhav/app-store-screenshots)
(MIT). This skill wraps that engine with brand auto-detection and headless
export. MIT — see [LICENSE](LICENSE).