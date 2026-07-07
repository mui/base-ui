// Reusable screenshot capture script for Deliverable D live-site captures
// (research/PROMPT.md §9.3). Batch-processes research/d-real-world-usage/_captures/sites.json.
//
// For each site:
//   1. Launch headless chromium, viewport 1440x900, goto(url, {waitUntil:'networkidle', timeout:20000})
//      falling back to {waitUntil:'load'} if networkidle times out (same attempt, a "fix").
//   2. Wait 1500ms, screenshot the viewport (not full page) -> <slug>.png
//   3. If the PNG exceeds 400KB, retry once at viewport 1200x750.
//   4. For overlay-component sites (dialog/menu/popover/select), try ONE cheap generic
//      interaction: look for a visible [aria-haspopup], [role="combobox"], or
//      [aria-expanded] trigger and click it, then take a second screenshot <slug>-open.png
//      if an overlay actually appeared (aria-expanded=true or a new [role=menu|listbox|dialog]
//      node became visible). This counts as one additional attempt.
//
// Writes research/d-real-world-usage/_captures/manifest-a.json when done.

import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';

const scriptDir = path.dirname(new URL(import.meta.url).pathname);
const sitesPath = path.join(scriptDir, 'sites.json');
const manifestPath = path.join(scriptDir, 'manifest-a-raw.json');

const sites = JSON.parse(fs.readFileSync(sitesPath, 'utf-8'));

async function tryGoto(page, url) {
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 });
    return 'networkidle';
  } catch (e) {
    await page.goto(url, { waitUntil: 'load', timeout: 20000 });
    return 'load (networkidle timed out)';
  }
}


// Cookie/consent banners ruin docs screenshots (owner feedback). Two passes:
// click a visible accept button if one exists, then CSS-hide the well-known CMP containers.
async function dismissCookieBanners(page) {
  const patterns = [
    /^accept( all)?( cookies)?$/i, /^allow all( cookies)?$/i, /^(i )?agree$/i,
    /^got it!?$/i, /^ok(ay)?$/i, /^accept & close$/i, /^alle akzeptieren$/i, /^tout accepter$/i,
  ];
  for (const re of patterns) {
    try {
      const btn = page.getByRole('button', { name: re }).first();
      if (await btn.isVisible({ timeout: 250 })) {
        await btn.click({ timeout: 1000 });
        await page.waitForTimeout(700);
        break;
      }
    } catch {}
  }
  try {
    await page.addStyleTag({
      content: [
        '#onetrust-consent-sdk, #onetrust-banner-sdk, #CybotCookiebotDialog, #cookiescript_injected,',
        '#usercentrics-root, .cc-window, .cky-consent-container, .osano-cm-window, #didomi-host,',
        '#hs-eu-cookie-confirmation, .qc-cmp2-container, .truste_box_overlay, #axeptio_overlay,',
        '[id*="cookie-banner" i], [class*="cookie-banner" i], [id*="cookie-consent" i],',
        '[class*="cookie-consent" i], [class*="cookieConsent" i], [id*="gdpr" i][role="dialog"],',
        '[aria-label*="cookie" i][role="dialog"], [aria-label*="consent" i][role="dialog"]',
        '{ display: none !important; }',
      ].join(' '),
    });
  } catch {}
  await page.waitForTimeout(300);
}

async function screenshotAtViewport(browser, url, outPath, viewport) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const strategy = await tryGoto(page, url);
  await page.waitForTimeout(1500);
  await dismissCookieBanners(page);
  await page.screenshot({ path: outPath });
  const bytes = fs.statSync(outPath).size;
  return { page, context, bytes, strategy };
}

async function tryOpenInteraction(page, outPath) {
  const selector = '[aria-haspopup]:visible, [role="combobox"]:visible, [aria-expanded="false"]:visible';
  // Playwright doesn't support :visible pseudo directly in all versions; use locator filter instead.
  const candidates = await page.locator('[aria-haspopup], [role="combobox"], [aria-expanded="false"]').all();
  for (const el of candidates) {
    try {
      if (!(await el.isVisible())) continue;
      await el.click({ timeout: 2000 });
      await page.waitForTimeout(600);
      // Check whether an overlay actually opened.
      const opened = await page.locator('[role="menu"], [role="listbox"], [role="dialog"], [aria-expanded="true"]').count();
      if (opened > 0) {
        await page.screenshot({ path: outPath });
        return { interacted: true, bytes: fs.statSync(outPath).size };
      }
    } catch (e) {
      // try next candidate
    }
  }
  return { interacted: false };
}

async function captureSite(browser, site) {
  const outPath = path.join(scriptDir, `${site.slug}.png`);
  const attempts = [];
  let status = 'skipped';
  let bytes = null;
  let openCaptured = false;
  let openBytes = null;

  try {
    let result = await screenshotAtViewport(browser, site.url, outPath, { width: 1440, height: 900 });
    attempts.push(`viewport 1440x900, waitUntil=${result.strategy}: ok, ${result.bytes} bytes`);
    bytes = result.bytes;

    if (result.bytes > 400 * 1024) {
      await result.context.close();
      const retry = await screenshotAtViewport(browser, site.url, outPath, { width: 1200, height: 750 });
      attempts.push(`retry viewport 1200x750 (was >400KB): ok, ${retry.bytes} bytes`);
      bytes = retry.bytes;
      result = retry;
    }

    status = 'captured';

    // Optional open-state interaction for overlay components, cheap heuristic only.
    const overlayComponents = ['dialog', 'menu', 'popover', 'select'];
    if (site.components.some((c) => overlayComponents.includes(c))) {
      try {
        const openOutPath = path.join(scriptDir, `${site.slug}-open.png`);
        const interactionResult = await tryOpenInteraction(result.page, openOutPath);
        if (interactionResult.interacted) {
          attempts.push(`open-state interaction: clicked a trigger, overlay detected, captured ${openOutPath} (${interactionResult.bytes} bytes)`);
          openCaptured = true;
          openBytes = interactionResult.bytes;
        } else {
          attempts.push('open-state interaction: no clickable trigger produced a detectable overlay, skipped');
        }
      } catch (e) {
        attempts.push(`open-state interaction: failed (${e.message})`);
      }
    }

    await result.context.close();
  } catch (err) {
    attempts.push(`failed: ${err && err.message ? err.message : String(err)}`);
    status = 'skipped';
  }

  return {
    url: site.url,
    domain: site.domain,
    components: site.components,
    file: status === 'captured' ? `${site.slug}.png` : null,
    fileOpen: openCaptured ? `${site.slug}-open.png` : null,
    status,
    attempts,
    bytes,
    bytesOpen: openBytes,
  };
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const manifest = [];
  for (const site of sites) {
    console.log(`Capturing ${site.url} ...`);
    const entry = await captureSite(browser, site);
    console.log(`  -> ${entry.status}${entry.fileOpen ? ' (+open state)' : ''}`);
    manifest.push(entry);
  }
  await browser.close();
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`\nWrote ${manifestPath}`);
})();
