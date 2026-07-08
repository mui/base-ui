// Component-highlight capture driver for Deliverable D "In the wild" entries.
//
// Where capture.mjs / capture-b.mjs answer "what does the page look like", this script
// answers "*where on the page* is the Base UI component, and how would an agent get back
// to it". For each target it produces:
//
//   1. <slug>.png            — the plain page screenshot (same framing as the other drivers)
//   2. <slug>-highlight.png  — the SAME framing with a spotlight overlay dimming everything
//                              except the located component, plus an outline + label box.
//
// and records, per target, the machine-actionable location so a later agent can drive the
// exact element without re-discovering it:
//
//   { slug, url, route, domain, components, selector, box, status, ... }
//
// `selector` is a concrete CSS selector that resolves to the highlighted element at capture
// time (either the one supplied in the target, or the role-based one this script fell back
// to). `route` is the URL pathname. `box` is the element's viewport rect.
//
// Run from apps/storybook so `playwright` resolves:
//   cd apps/storybook && node ../../research/d-real-world-usage/_captures/capture-highlight.mjs
//
// Targets come from highlight-targets.json alongside this script. Each target:
//   { "slug", "url", "domain", "components": [...],
//     "selector"?: "css",              // explicit element to highlight (preferred)
//     "interact"?: { "kind": "text"|"selector", "value": "..." }, // reveal an overlay first
//     "overlayRole"?: "dialog"|"menu"|"listbox" }                 // role to grab post-interact
//
// Writes highlight-manifest.json (this run) and merges results into in-the-wild.json
// (the durable, human+agent-readable index) next to the screenshots.

import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const targetsPath = path.join(scriptDir, 'highlight-targets.json');
const manifestPath = path.join(scriptDir, 'highlight-manifest.json');
const indexPath = path.join(scriptDir, 'in-the-wild.json');

const VIEWPORT = { width: 1440, height: 900 };

// Kept in sync with the identical helper in capture.mjs / capture-b.mjs.
async function dismissCookieBanners(page) {
  const patterns = [
    /^accept( all)?( cookies)?$/i,
    /^allow all( cookies)?$/i,
    /^(i )?agree$/i,
    /^got it!?$/i,
    /^ok(ay)?$/i,
    /^accept & close$/i,
    /^alle akzeptieren$/i,
    /^tout accepter$/i,
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

async function tryGoto(page, url) {
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 });
    return 'networkidle';
  } catch {
    await page.goto(url, { waitUntil: 'load', timeout: 20000 });
    return 'load (networkidle timed out)';
  }
}

// Inject a spotlight overlay: dim the whole viewport except the target rect (via a huge
// box-shadow), draw a bright outline around it, and label it with the component name(s).
async function applyHighlight(page, handle, label) {
  await page.evaluate(
    ({ selectorArgs }) => {
      const { rect, text } = selectorArgs;
      const prev = document.getElementById('__baseui_highlight__');
      if (prev) prev.remove();
      const layer = document.createElement('div');
      layer.id = '__baseui_highlight__';
      layer.style.cssText = 'position:fixed;inset:0;z-index:2147483647;pointer-events:none;';

      const box = document.createElement('div');
      box.style.cssText = [
        'position:fixed',
        'left:' + rect.x + 'px',
        'top:' + rect.y + 'px',
        'width:' + rect.width + 'px',
        'height:' + rect.height + 'px',
        'border:2px solid #4f9dff',
        'border-radius:6px',
        'box-shadow:0 0 0 2px rgba(79,157,255,.35), 0 0 0 100000px rgba(10,12,18,.55)',
      ].join(';');
      layer.appendChild(box);

      if (text) {
        const tag = document.createElement('div');
        const top = rect.y > 28 ? rect.y - 26 : rect.y + rect.height + 6;
        tag.textContent = text;
        tag.style.cssText = [
          'position:fixed',
          'left:' + rect.x + 'px',
          'top:' + top + 'px',
          'padding:2px 8px',
          'background:#4f9dff',
          'color:#fff',
          'font:600 12px/1.4 ui-sans-serif,system-ui,sans-serif',
          'border-radius:4px',
          'white-space:nowrap',
        ].join(';');
        layer.appendChild(tag);
      }
      document.body.appendChild(layer);
    },
    { selectorArgs: { rect: await handle.boundingBox(), text: label } },
  );
  await page.waitForTimeout(120);
}

async function locateTarget(page, target) {
  // 1. Optional interaction to reveal an overlay component.
  if (target.interact) {
    try {
      if (target.interact.kind === 'text') {
        await page
          .getByText(target.interact.value, { exact: false })
          .first()
          .click({ timeout: 3000 });
      } else if (target.interact.kind === 'selector') {
        await page.click(target.interact.value, { timeout: 3000 });
      }
      await page.waitForTimeout(600);
      await dismissCookieBanners(page);
    } catch (e) {
      return {
        handle: null,
        selector: null,
        note: `interact failed: ${String(e.message || e).slice(0, 100)}`,
      };
    }
  }

  // 2. Prefer an explicit selector, then a role-based overlay, then a generic role scan.
  const roleFallback = target.overlayRole
    ? [`[role="${target.overlayRole}"]`]
    : ['[role="dialog"]', '[role="menu"]', '[role="listbox"]'];
  const selectors = [target.selector, ...roleFallback].filter(Boolean);

  for (const sel of selectors) {
    try {
      const loc = page.locator(sel).first();
      if (await loc.isVisible({ timeout: 1500 })) {
        const handle = await loc.elementHandle();
        // Report a concrete selector: an explicit single selector wins; otherwise (a union
        // or a role fallback) collapse to the matched element's own role, which is concrete
        // and actionable (and paired with the box, so any ambiguity is resolvable).
        const role = await handle.getAttribute('role').catch(() => null);
        const isSingleExplicit =
          target.selector != null && target.selector === sel && !sel.includes(',');
        const selector = isSingleExplicit ? sel : role ? `[role="${role}"]` : sel;
        return { handle, selector, role, note: `matched ${sel}` };
      }
    } catch {}
  }
  return { handle: null, selector: null, role: null, note: 'no target element located' };
}

// ARIA role → friendly Base UI component name, for the highlight box label.
const ROLE_LABELS = {
  tablist: 'Tabs',
  menubar: 'Menubar',
  switch: 'Switch',
  slider: 'Slider',
  radiogroup: 'Radio Group',
  checkbox: 'Checkbox',
  combobox: 'Combobox',
  meter: 'Meter',
  progressbar: 'Progress',
  dialog: 'Dialog',
  menu: 'Menu',
  listbox: 'Select',
  tab: 'Tabs',
  separator: 'Separator',
};

async function captureTarget(browser, target) {
  const basePath = path.join(scriptDir, `${target.slug}.png`);
  const highlightPath = path.join(scriptDir, `${target.slug}-highlight.png`);
  const entry = {
    slug: target.slug,
    url: target.url,
    route: (() => {
      try {
        return new URL(target.url).pathname || '/';
      } catch {
        return null;
      }
    })(),
    domain:
      target.domain ??
      (() => {
        try {
          return new URL(target.url).hostname;
        } catch {
          return null;
        }
      })(),
    components: target.components ?? [],
    selector: target.selector ?? null,
    matchedRole: null,
    box: null,
    file: null,
    fileHighlight: null,
    status: 'skipped',
    notes: [],
  };

  const context = await browser.newContext({ viewport: VIEWPORT });
  const page = await context.newPage();
  try {
    const strategy = await tryGoto(page, target.url);
    entry.notes.push(`goto: ${strategy}`);
    await page.waitForTimeout(1500);
    await dismissCookieBanners(page);

    const located = await locateTarget(page, target);
    entry.notes.push(located.note);
    if (located.handle) {
      // Scroll the component into view FIRST, then capture the plain and highlighted frames
      // back-to-back at the same scroll position — so the two screenshots are pixel-identical
      // apart from the overlay (and the plain frame always actually contains the component).
      await located.handle.scrollIntoViewIfNeeded().catch(() => {});
      await page.waitForTimeout(200);
      const box = await located.handle.boundingBox();
      entry.box = box
        ? {
            x: Math.round(box.x),
            y: Math.round(box.y),
            width: Math.round(box.width),
            height: Math.round(box.height),
          }
        : null;
      entry.selector = located.selector ?? entry.selector;

      await page.screenshot({ path: basePath });
      entry.file = path.basename(basePath);

      entry.matchedRole = located.role ?? null;
      const label =
        (located.role && ROLE_LABELS[located.role]) ?? entry.components[0] ?? 'Base UI component';
      await applyHighlight(page, located.handle, label);
      await page.screenshot({ path: highlightPath });
      entry.fileHighlight = path.basename(highlightPath);
      entry.status = 'captured';
    } else {
      // No component located — fall back to a plain top-of-page screenshot.
      await page.screenshot({ path: basePath });
      entry.file = path.basename(basePath);
      entry.status = 'page-only';
    }
  } catch (err) {
    entry.notes.push(`failed: ${String(err.message || err).slice(0, 160)}`);
    entry.status = entry.file ? 'page-only' : 'skipped';
  } finally {
    await context.close();
  }

  console.log(`  -> ${entry.status}${entry.fileHighlight ? ' (+highlight)' : ''}: ${target.url}`);
  return entry;
}

function mergeIntoIndex(entries) {
  let index = { version: 1, generatedBy: 'capture-highlight.mjs', entries: {} };
  if (fs.existsSync(indexPath)) {
    try {
      index = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
      index.entries = index.entries ?? {};
    } catch {}
  }
  for (const e of entries) {
    index.entries[e.slug] = {
      url: e.url,
      route: e.route,
      domain: e.domain,
      components: e.components,
      selector: e.selector,
      matchedRole: e.matchedRole ?? null,
      box: e.box,
      screenshot: e.file,
      screenshotHighlight: e.fileHighlight,
      status: e.status,
    };
  }
  fs.writeFileSync(indexPath, `${JSON.stringify(index, null, 2)}\n`);
  console.log(`Merged ${entries.length} entries into ${path.basename(indexPath)}`);
}

(async () => {
  if (!fs.existsSync(targetsPath)) {
    console.error(`No targets file at ${targetsPath}. Create highlight-targets.json first.`);
    process.exit(1);
  }
  const targets = JSON.parse(fs.readFileSync(targetsPath, 'utf-8'));
  const browser = await chromium.launch({ headless: true });
  const manifest = [];
  for (const target of targets) {
    console.log(`Capturing ${target.url} ...`);
    // eslint-disable-next-line no-await-in-loop
    manifest.push(await captureTarget(browser, target));
  }
  await browser.close();

  // Merge (upsert by slug) into any existing manifest so incremental/retry runs accumulate
  // rather than clobber a prior batch.
  let merged = manifest;
  if (fs.existsSync(manifestPath)) {
    try {
      const prev = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      if (Array.isArray(prev)) {
        const bySlug = new Map(prev.map((e) => [e.slug, e]));
        for (const entry of manifest) {
          bySlug.set(entry.slug, entry);
        }
        merged = [...bySlug.values()];
      }
    } catch {}
  }
  fs.writeFileSync(manifestPath, `${JSON.stringify(merged, null, 2)}\n`);
  console.log(`\nWrote ${path.basename(manifestPath)} (${merged.length} total)`);
  mergeIntoIndex(merged);
})();
