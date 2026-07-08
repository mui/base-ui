import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = 'http://localhost:6116';

const indexPath = path.join(__dirname, 'index.json');
const index = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));

const allDocs = Object.values(index.entries).filter((e) => e.id.endsWith('--docs'));
const nonResearch = allDocs.filter((e) => !e.tags.includes('research'));
const researchAbout = allDocs.filter((e) => e.id === 'research-about-this-research--docs');
const researchSamples = allDocs
  .filter((e) => e.tags.includes('research') && e.id !== 'research-about-this-research--docs')
  .slice(0, 3);

const targets = [...nonResearch, ...researchAbout, ...researchSamples];

console.log(`Total docs entries: ${allDocs.length}`);
console.log(`Non-research: ${nonResearch.length}`);
console.log(`Research samples (incl. about): ${researchAbout.length + researchSamples.length}`);
console.log(`Sweeping: ${targets.length} pages`);

const MARKDOWN_ARTIFACT_PATTERNS = [
  { name: 'literal-table-separator', re: /\|---\|/ },
  { name: 'literal-code-fence', re: /```/ },
  { name: 'unrendered-mdx-comment', re: /\{\/\*/ },
  { name: 'literal-bracket-g', re: /\[G\]/ },
  { name: 'bare-h4-line', re: /^####\s/m },
  { name: 'raw-query-param', re: /\?raw\b/ },
];

const results = [];

const browser = await chromium.launch();

for (const entry of targets) {
  const page = await browser.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  page.on('pageerror', (err) => {
    pageErrors.push(String(err));
  });

  const problems = [];
  const url = `${BASE}/iframe.html?viewMode=docs&id=${entry.id}`;

  try {
    await page.goto(url, { waitUntil: 'load', timeout: 30000 });
    try {
      await page.waitForSelector('.sbdocs-content', { timeout: 10000 });
    } catch {
      problems.push({ type: 'no-docs-content', detail: 'sbdocs-content selector never appeared' });
    }
    await page.waitForTimeout(1200);

    // Scroll to bottom to trigger lazy-loaded images, then back check.
    await page.evaluate(async () => {
      const distance = 400;
      const delay = 60;
      let total = 0;
      const scrollHeight = document.body.scrollHeight;
      while (total < scrollHeight) {
        window.scrollBy(0, distance);
        total += distance;
        await new Promise((r) => setTimeout(r, delay));
      }
    });
    await page.waitForTimeout(800);

    // (a) error indicators
    const errorIndicators = await page.evaluate(() => {
      const found = [];
      const errDisplay = document.querySelector('.sb-errordisplay');
      if (errDisplay && errDisplay.offsetParent !== null) {
        found.push({ kind: 'sb-errordisplay-visible', text: errDisplay.textContent?.slice(0, 300) });
      }
      const bodyText = document.body.innerText || '';
      if (bodyText.includes("couldn't be auto-generated") || bodyText.includes('could not be auto-generated')) {
        found.push({ kind: 'auto-generate-failed-text' });
      }
      // "No Preview" visible check - must not be display:none/hidden and must be in viewport-relevant flow
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = walker.nextNode())) {
        if (node.textContent && node.textContent.includes('No Preview')) {
          const el = node.parentElement;
          if (el) {
            const style = window.getComputedStyle(el);
            if (style.display !== 'none' && style.visibility !== 'hidden' && el.offsetParent !== null) {
              found.push({ kind: 'no-preview-visible', text: node.textContent.trim() });
            }
          }
        }
      }
      // React error boundary text patterns
      if (bodyText.match(/Something went wrong/i) || bodyText.match(/Error boundary/i)) {
        found.push({ kind: 'error-boundary-text' });
      }
      return found;
    });
    if (errorIndicators.length) {
      problems.push({ type: 'error-indicator', detail: errorIndicators });
    }

    // (b) unrendered markdown artifacts
    const bodyText = await page.evaluate(() => document.body.innerText || '');
    for (const pattern of MARKDOWN_ARTIFACT_PATTERNS) {
      const match = bodyText.match(pattern.re);
      if (match) {
        const idx = match.index ?? 0;
        const context = bodyText.slice(Math.max(0, idx - 60), idx + 60).replace(/\n/g, ' \\n ');
        problems.push({ type: 'markdown-artifact', name: pattern.name, context });
      }
    }

    // (c) broken images
    const brokenImages = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      return imgs
        .filter((img) => img.complete && img.naturalWidth === 0)
        .map((img) => ({ src: img.src, alt: img.alt }));
    });
    if (brokenImages.length) {
      problems.push({ type: 'broken-image', detail: brokenImages });
    }

    // (d) console errors
    if (consoleErrors.length) {
      problems.push({ type: 'console-error', detail: consoleErrors.slice(0, 10) });
    }
    if (pageErrors.length) {
      problems.push({ type: 'page-error', detail: pageErrors.slice(0, 10) });
    }
  } catch (e) {
    problems.push({ type: 'navigation-error', detail: String(e) });
  }

  results.push({ id: entry.id, title: entry.title, tags: entry.tags, problems });
  console.log(`${problems.length === 0 ? 'OK ' : 'ISSUE'} ${entry.id} (${problems.length} problem groups)`);
  await page.close();
}

await browser.close();

const reportPath = path.join(__dirname, 'docs-sweep-report.json');
fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));

const withProblems = results.filter((r) => r.problems.length > 0);
console.log('\n=== SUMMARY ===');
console.log(`Swept: ${results.length} pages`);
console.log(`Pages with problems: ${withProblems.length}`);
for (const r of withProblems) {
  console.log(`- ${r.id}: ${r.problems.map((p) => p.type).join(', ')}`);
}
