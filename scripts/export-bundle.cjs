#!/usr/bin/env node
/*
 * Headless export of a screenshot-editor deck to a zip of store-ready PNGs.
 *
 * The editor's "Export bundle" button renders every slide x every required
 * size via html-to-image and triggers a blob download. There is no CLI export,
 * so we drive the real button in headless Chrome and capture the download via
 * the DevTools Protocol. This is faithful — identical pixels to a human click.
 *
 * Usage:
 *   node export-bundle.cjs --project <dir> --device iphone|ipad [--port 3000] [--out <dir>]
 *
 * Requirements:
 *   - The editor dev server is already running for <project> on <port>.
 *   - puppeteer-core is installed in <project> (bun add -d puppeteer-core).
 *   - Google Chrome (or set --chrome <path>).
 *
 * Prints the final line "ZIP:<path>" on success; exits non-zero otherwise.
 */
const fs = require("fs");
const path = require("path");

function arg(name, def) {
  const i = process.argv.indexOf("--" + name);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : def;
}

const projectDir = path.resolve(arg("project", process.cwd()));
const device = arg("device", "iphone");
const port = arg("port", "3000");
const chrome = arg(
  "chrome",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
);
const out = path.resolve(arg("out", `/tmp/ass-export/${device}`));
const PROJECT_FILE = path.join(projectDir, "app-store-screenshots.json");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Resolve puppeteer-core from the project (where it's installed), then globally.
let puppeteer;
try {
  puppeteer = require(path.join(projectDir, "node_modules", "puppeteer-core"));
} catch {
  puppeteer = require("puppeteer-core");
}

(async () => {
  // Point the project at the device we want; a fresh headless load (no
  // localStorage) reads device straight from this file.
  const state = JSON.parse(fs.readFileSync(PROJECT_FILE, "utf8"));
  state.device = device;
  fs.writeFileSync(PROJECT_FILE, JSON.stringify(state, null, 2) + "\n");

  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(out, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: chrome,
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--force-device-scale-factor=1"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1680, height: 1200, deviceScaleFactor: 1 });
  const client = await page.target().createCDPSession();
  await client.send("Page.setDownloadBehavior", { behavior: "allow", downloadPath: out });
  try {
    await client.send("Browser.setDownloadBehavior", {
      behavior: "allow", downloadPath: out, eventsEnabled: true,
    });
  } catch {}

  console.log(`[${device}] loading editor on :${port} …`);
  await page.goto(`http://localhost:${port}`, { waitUntil: "networkidle2", timeout: 60000 });

  // Brand fonts are @font-face'd; html-to-image only embeds loaded faces, so
  // wait for them or exported headlines fall back to a system font.
  await page.evaluate(async () => {
    try { await document.fonts.ready; } catch {}
  });

  await page.waitForFunction(() => {
    const b = [...document.querySelectorAll("button")].find((x) =>
      /Export bundle/i.test(x.textContent || ""));
    return b && !b.disabled;
  }, { timeout: 60000 });

  console.log(`[${device}] clicking Export bundle …`);
  await page.evaluate(() => {
    const b = [...document.querySelectorAll("button")].find((x) =>
      /Export bundle/i.test(x.textContent || ""));
    b.click();
  });

  // Wait for the .zip to finish (no .crdownload partial).
  const deadline = Date.now() + 240000;
  let zip = null;
  while (Date.now() < deadline) {
    const files = fs.readdirSync(out);
    const z = files.find((f) => f.endsWith(".zip"));
    const partial = files.some((f) => f.endsWith(".crdownload"));
    if (z && !partial && fs.statSync(path.join(out, z)).size > 0) {
      zip = path.join(out, z);
      break;
    }
    await sleep(1000);
  }
  await browser.close();
  if (!zip) { console.error(`[${device}] NO_ZIP — export did not complete`); process.exit(2); }
  console.log("ZIP:" + zip);
})().catch((e) => { console.error(e); process.exit(1); });
