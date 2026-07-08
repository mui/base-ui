// Generates in-the-wild.json — the durable, human+agent-readable index of every "In the
// wild" capture. It unifies the three capture drivers' manifests into one record per site,
// keyed by slug, each carrying the agent-actionable location fields:
//
//   { url, route, domain, components, selector, box,
//     screenshot, screenshotOpen, screenshotHighlight, status }
//
// - url/domain/components/screenshot/screenshotOpen come from manifest-a.json + manifest-b.json
//   (the plain + open-state page captures).
// - route is the URL pathname.
// - selector/box/screenshotHighlight come from highlight-manifest.json (capture-highlight.mjs),
//   merged onto the matching base site (its `<slug>-hl` target is folded back onto `<slug>`).
// - selector/box are null until a highlight capture has located the component — that's the
//   signal to a later agent that this entry still needs a highlight pass.
//
// Run from anywhere:
//   node research/d-real-world-usage/_captures/build-in-the-wild-index.mjs

import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const read = (name) => {
  const p = path.join(dir, name);
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf-8')) : null;
};

const routeOf = (url) => {
  try {
    return new URL(url).pathname || '/';
  } catch {
    return null;
  }
};
const slugOf = (entry) =>
  (entry.file ? path.basename(entry.file, '.png') : entry.domain || entry.url || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const entries = {};

// 1. Base + open-state page captures (batches A and B).
for (const manifestName of ['manifest-a.json', 'manifest-b.json']) {
  const manifest = read(manifestName);
  if (!Array.isArray(manifest)) {
    continue;
  }
  for (const e of manifest) {
    const slug = slugOf(e);
    if (!slug) {
      continue;
    }
    entries[slug] = {
      url: e.url ?? null,
      route: e.url ? routeOf(e.url) : null,
      domain: e.domain ?? null,
      components: e.components ?? [],
      selector: null,
      matchedRole: null,
      box: null,
      screenshot: e.file ?? null,
      screenshotOpen: e.fileOpen ?? null,
      screenshotHighlight: null,
      status: e.status ?? null,
    };
  }
}

// A union/fallback capture records its concrete match as the matched element's role.
const resolveSelector = (selector, role) =>
  selector && selector.includes(',') && role ? `[role="${role}"]` : selector;

// 2. Highlight captures — fold `<slug>-hl` back onto the base `<slug>` and attach the
//    located selector/box/highlight image. Create a standalone entry if there's no base.
const highlights = read('highlight-manifest.json');
if (Array.isArray(highlights)) {
  for (const h of highlights) {
    const baseSlug = h.slug.replace(/-hl$/, '');
    const target =
      entries[baseSlug] ??
      entries[h.slug] ??
      (entries[baseSlug] = {
        url: h.url ?? null,
        route: h.route ?? null,
        domain: h.domain ?? null,
        components: h.components ?? [],
        selector: null,
        matchedRole: null,
        box: null,
        screenshot: h.file ?? null,
        screenshotOpen: null,
        screenshotHighlight: null,
        status: h.status ?? null,
      });
    target.matchedRole = h.matchedRole ?? target.matchedRole;
    target.selector = resolveSelector(h.selector, h.matchedRole) ?? target.selector;
    target.box = h.box ?? target.box;
    target.screenshotHighlight = h.fileHighlight ?? target.screenshotHighlight;
    if (!target.url) {
      target.url = h.url ?? null;
      target.route = h.route ?? routeOf(h.url ?? '');
    }
  }
}

const sorted = Object.keys(entries)
  .sort()
  .reduce((acc, k) => {
    acc[k] = entries[k];
    return acc;
  }, {});

const withHighlight = Object.values(sorted).filter((e) => e.screenshotHighlight).length;
const index = {
  version: 1,
  generatedBy: 'build-in-the-wild-index.mjs',
  note: 'One record per In-the-wild site. `selector`/`box`/`screenshotHighlight` are populated by capture-highlight.mjs; null means a highlight pass is still pending.',
  counts: { total: Object.keys(sorted).length, withHighlight },
  entries: sorted,
};

const outPath = path.join(dir, 'in-the-wild.json');
fs.writeFileSync(outPath, `${JSON.stringify(index, null, 2)}\n`);
console.log(
  `Wrote ${path.basename(outPath)}: ${index.counts.total} sites, ${withHighlight} with a component highlight.`,
);
