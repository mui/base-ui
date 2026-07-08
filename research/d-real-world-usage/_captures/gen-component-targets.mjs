// Generates highlight-targets.json for the per-component "in the wild" pass: one target per
// (showcase-site, Base UI component) docs card, pointing at that component's OWN page on the
// site and selecting its live demo. Discovered patterns (2026-07-08):
//   - 9ui.dev    /docs/components/<slug>        selector [data-slot="<slug>"]
//   - reui.io    /components/<slug>             selector [data-slot="components-preview"]
//   - coss.com   /ui/docs/components/<slug>     selector [data-slot="preview"]
//   - lumiui.dev /docs/components/<cat>/<slug>  selector [data-slot="<component>"]
//
//   node research/d-real-world-usage/_captures/gen-component-targets.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const nice = (c) =>
  c.replace(/(^|-)([a-z])/g, (_, s, ch) => (s ? ' ' : '') + ch.toUpperCase()).trim();

// component → sites that have a docs card with a real screenshot.
const MATRIX = {
  accordion: ['9ui', 'lumiui', 'reui'],
  'alert-dialog': ['9ui', 'lumiui'],
  avatar: ['9ui', 'lumiui', 'reui'],
  button: ['9ui'],
  'checkbox-group': ['9ui', 'coss', 'lumiui'],
  checkbox: ['coss', 'reui'],
  collapsible: ['9ui'],
  'context-menu': ['coss', 'lumiui', 'reui'],
  drawer: ['coss', 'reui'],
  fieldset: ['coss', 'lumiui'],
  input: ['9ui'],
  menubar: ['lumiui'],
  meter: ['9ui', 'lumiui'],
  'navigation-menu': ['9ui', 'lumiui'],
  'number-field': ['9ui', 'coss', 'lumiui'],
  'otp-field': ['9ui', 'coss', 'lumiui'],
  'preview-card': ['9ui', 'coss', 'lumiui'],
  progress: ['9ui', 'coss', 'lumiui'],
  radio: ['9ui'],
  'scroll-area': ['9ui', 'lumiui', 'reui'],
  separator: ['9ui', 'lumiui'],
  slider: ['9ui', 'coss', 'lumiui'],
  switch: ['reui'],
  tabs: ['9ui'],
  toast: ['lumiui'],
  'toggle-group': ['9ui', 'lumiui'],
  toggle: ['coss', 'reui'],
  toolbar: ['9ui', 'lumiui'],
  tooltip: ['reui'],
};

// 9ui / lumiui slug overrides (Base UI name → site's URL slug / data-slot).
const NINE_UI_SLUG = { 'otp-field': 'input-otp', radio: 'radio-group' };

// lumiui categorized paths (Base UI name → full path).
const LUMIUI_PATH = {
  accordion: 'layout-nav/accordion',
  'alert-dialog': 'overlays-dialogs/alert-dialog',
  avatar: 'display-media/avatar',
  'checkbox-group': 'form-input/checkbox-group',
  'context-menu': 'overlays-dialogs/context-menu',
  fieldset: 'form-input/fieldset',
  menubar: 'misc/menubar',
  meter: 'feedback-status/meter',
  'navigation-menu': 'layout-nav/navigation-menu',
  'number-field': 'form-input/number-field',
  'otp-field': 'form-input/otp-field',
  'preview-card': 'overlays-dialogs/preview-card',
  progress: 'feedback-status/progress',
  'scroll-area': 'layout-nav/scroll-area',
  separator: 'layout-nav/separator',
  slider: 'form-input/slider',
  toast: 'feedback-status/toast',
  'toggle-group': 'misc/toggle-group',
  toolbar: 'misc/toolbar',
};

const SITES = {
  '9ui': {
    domain: '9ui.dev',
    url: (c) => `https://www.9ui.dev/docs/components/${NINE_UI_SLUG[c] ?? c}`,
    selector: (c) => `[data-slot="${NINE_UI_SLUG[c] ?? c}"]`,
  },
  reui: {
    domain: 'reui.io',
    url: (c) => `https://reui.io/components/${c}`,
    selector: () => '[data-slot="components-preview"]',
  },
  coss: {
    domain: 'coss.com',
    url: (c) => `https://coss.com/ui/docs/components/${c}`,
    selector: () => '[data-slot="preview"]',
  },
  lumiui: {
    domain: 'lumiui.dev',
    url: (c) => `https://www.lumiui.dev/docs/components/${LUMIUI_PATH[c]}`,
    selector: (c) => `[data-slot="${c}"]`,
  },
};

const targets = [];
for (const [component, sites] of Object.entries(MATRIX)) {
  for (const siteKey of sites) {
    const site = SITES[siteKey];
    if (!site) {
      continue;
    }
    targets.push({
      slug: `${siteKey}-${component}-hl`,
      url: site.url(component),
      domain: site.domain,
      components: [nice(component)],
      // The demo root/wrapper, then broad role/overlay fallbacks the driver already applies.
      selector: site.selector(component),
    });
  }
}

fs.writeFileSync(path.join(dir, 'highlight-targets.json'), `${JSON.stringify(targets, null, 2)}\n`);
console.log(`wrote ${targets.length} component targets across ${Object.keys(SITES).length} sites`);
