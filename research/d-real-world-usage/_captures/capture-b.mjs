// Batch B screenshot capture driver for Deliverable D live-site captures.
// Reuses the same approach as batch A's capture.mjs (viewport 1440x900, PNG,
// <=400KB via viewport fallback, one cheap open-state interaction attempt),
// but as a self-contained batch runner over batch B's own domain list so we
// don't collide with batch A's in-place edits to capture.mjs.
//
// Run from apps/storybook (so the `playwright` package resolves), e.g.:
//   cd apps/storybook && node ../../research/d-real-world-usage/_captures/capture-b.mjs
//
// Writes PNGs to research/d-real-world-usage/_captures/<slug>.png (+ -open.png
// variant when an interaction produced a visibly different state) and a
// manifest-b.json summary alongside them.

import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const outDir = scriptDir;

// Sites to capture. `components` records which Tier candidates.json files
// referenced this liveUrl. `interact` is a best-effort single click to try
// to reveal an open/interactive state on component-showcase sites; omitted
// for marketing/docs sites where guessing a selector is unlikely to help.
const SITES = [
  {
    url: 'https://www.9ui.dev',
    slug: '9ui-dev',
    domain: '9ui.dev',
    components: [
      'tabs',
      'autocomplete',
      'alert-dialog',
      'navigation-menu',
      'number-field',
      'otp-field',
      'slider',
      'preview-card',
      'scroll-area',
      'accordion',
      'radio',
      'avatar',
      'button',
      'collapsible',
      'input',
      'meter',
      'progress',
      'separator',
      'toggle-group',
      'toolbar',
      'checkbox-group',
      'form',
    ],
    interact: { kind: 'text', value: 'Accordion' },
  },
  {
    url: 'https://reui.io',
    slug: 'reui-io',
    domain: 'reui.io',
    components: [
      'drawer',
      'switch',
      'tooltip',
      'toggle',
      'context-menu',
      'scroll-area',
      'accordion',
      'checkbox',
      'avatar',
    ],
    interact: { kind: 'text', value: 'Components' },
  },
  {
    url: 'https://www.lumiui.dev',
    slug: 'lumiui-dev',
    domain: 'lumiui.dev',
    components: [
      'toast',
      'menubar',
      'context-menu',
      'alert-dialog',
      'navigation-menu',
      'field',
      'number-field',
      'otp-field',
      'slider',
      'preview-card',
      'accordion',
      'avatar',
      'meter',
      'progress',
      'separator',
      'toggle-group',
      'toolbar',
      'checkbox-group',
      'form',
    ],
    interact: { kind: 'text', value: 'Docs' },
  },
  {
    url: 'https://coss.com/ui',
    slug: 'coss-com-ui',
    domain: 'coss.com',
    components: [
      'combobox',
      'drawer',
      'toggle',
      'context-menu',
      'number-field',
      'otp-field',
      'slider',
      'preview-card',
      'checkbox',
      'fieldset',
      'progress',
      'checkbox-group',
      'form',
    ],
    interact: null,
  },
  {
    url: 'https://www.baseui-cn.com',
    slug: 'baseui-cn-com',
    domain: 'baseui-cn.com',
    components: ['toast', 'drawer'],
    interact: null,
  },
  {
    url: 'https://developers.cloudflare.com',
    slug: 'developers-cloudflare-com',
    domain: 'developers.cloudflare.com',
    components: ['combobox'],
    interact: null,
  },
  {
    url: 'https://typebot.io',
    slug: 'typebot-io',
    domain: 'typebot.io',
    components: ['combobox'],
    interact: null,
  },
  {
    url: 'https://gitbutler.com',
    slug: 'gitbutler-com',
    domain: 'gitbutler.com',
    components: ['combobox'],
    interact: null,
  },
  {
    url: 'https://chanhdai.com',
    slug: 'chanhdai-com',
    domain: 'chanhdai.com',
    components: ['ecosystem'],
    interact: null,
  },
  {
    url: 'https://woocommerce.com',
    slug: 'woocommerce-com',
    domain: 'woocommerce.com',
    components: ['combobox'],
    interact: null,
  },
  {
    url: 'https://electric.ax',
    slug: 'electric-ax',
    domain: 'electric.ax',
    components: ['combobox'],
    interact: null,
  },
  {
    url: 'https://latitude.so',
    slug: 'latitude-so',
    domain: 'latitude.so',
    components: ['combobox'],
    interact: null,
  },
  {
    url: 'https://kaneo.app/',
    slug: 'kaneo-app',
    domain: 'kaneo.app',
    components: ['combobox'],
    interact: null,
  },
  {
    url: 'https://dbhub.ai',
    slug: 'dbhub-ai',
    domain: 'dbhub.ai',
    components: ['combobox'],
    interact: null,
  },
  {
    url: 'https://mui-treasury.com',
    slug: 'mui-treasury-com',
    domain: 'mui-treasury.com',
    components: ['menubar'],
    interact: null,
  },
];

// Cookie/consent banners ruin docs screenshots (owner feedback). Two passes:
// click a visible accept button if one exists, then CSS-hide the well-known CMP containers.
// (Kept in sync with the identical helper in capture.mjs / batch A.)
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

async function attempt(url, viewportStr, interact) {
  const [w, h] = viewportStr.split('x').map(Number);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: w, height: h } });
  const page = await context.newPage();
  const attemptsLog = [];
  try {
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 });
      attemptsLog.push(`viewport ${viewportStr}, waitUntil=networkidle: ok`);
    } catch (e) {
      await page.goto(url, { waitUntil: 'load', timeout: 20000 });
      attemptsLog.push(`viewport ${viewportStr}, waitUntil=load (networkidle timed out): ok`);
    }
    await page.waitForTimeout(1500);
    await dismissCookieBanners(page);
    attemptsLog.push('banner-dismissal applied');

    const baseBytes = await screenshotToBuffer(page);

    let openBytes = null;
    let interacted = false;
    if (interact) {
      try {
        if (interact.kind === 'text') {
          await page.getByText(interact.value, { exact: false }).first().click({ timeout: 3000 });
        } else if (interact.kind === 'selector') {
          await page.click(interact.value, { timeout: 3000 });
        }
        await page.waitForTimeout(600);
        interacted = true;
        await dismissCookieBanners(page);
        openBytes = await screenshotToBuffer(page);
      } catch (e) {
        attemptsLog.push(`open-state interaction failed: ${String(e.message || e).slice(0, 120)}`);
      }
    }

    await browser.close();
    return { baseBytes, openBytes, interacted, attemptsLog };
  } catch (err) {
    await browser.close();
    throw err;
  }

  async function screenshotToBuffer(p) {
    return p.screenshot();
  }
}

async function captureSite(site) {
  const outPath = path.join(outDir, `${site.slug}.png`);
  const outPathOpen = path.join(outDir, `${site.slug}-open.png`);
  const entry = {
    url: site.url,
    domain: site.domain,
    components: site.components,
    file: null,
    fileOpen: null,
    status: 'skipped',
    attempts: [],
    bytes: null,
    bytesOpen: null,
  };

  const viewports = ['1440x900', '1200x750', '1000x650', '900x600'];
  let lastErr = null;
  for (let i = 0; i < viewports.length && entry.status !== 'captured'; i += 1) {
    const vp = viewports[i];
    try {
      const result = await attempt(site.url, vp, site.interact);
      entry.attempts.push(...result.attemptsLog);
      if (result.baseBytes.length <= 400 * 1024 || i === viewports.length - 1) {
        fs.writeFileSync(outPath, result.baseBytes);
        entry.file = path.basename(outPath);
        entry.bytes = fs.statSync(outPath).size;
        entry.attempts.push(`saved base screenshot: ${entry.bytes} bytes`);
        entry.status = 'captured';
        if (result.interacted && result.openBytes) {
          fs.writeFileSync(outPathOpen, result.openBytes);
          entry.fileOpen = path.basename(outPathOpen);
          entry.bytesOpen = fs.statSync(outPathOpen).size;
          entry.attempts.push(`saved open-state screenshot: ${entry.bytesOpen} bytes`);
        }
      } else {
        entry.attempts.push(
          `viewport ${vp} produced ${result.baseBytes.length} bytes (>400KB), retrying smaller`,
        );
      }
    } catch (err) {
      lastErr = err;
      entry.attempts.push(`viewport ${vp}: failed - ${String(err.message || err).slice(0, 160)}`);
    }
  }

  if (entry.status !== 'captured') {
    entry.status = 'skipped';
    if (lastErr) entry.attempts.push(`final: skipped after ${viewports.length} attempts`);
  }

  console.log(
    `${entry.status === 'captured' ? '  -> captured' + (entry.fileOpen ? ' (+open state)' : '') : '  -> SKIPPED'}: ${site.url}`,
  );
  return entry;
}

(async () => {
  const manifest = [];
  for (const site of SITES) {
    console.log(`Capturing ${site.url} ...`);
    // eslint-disable-next-line no-await-in-loop
    const entry = await captureSite(site);
    manifest.push(entry);
  }
  const manifestPath = path.join(outDir, 'manifest-b.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`\nWrote ${manifestPath}`);
})();
