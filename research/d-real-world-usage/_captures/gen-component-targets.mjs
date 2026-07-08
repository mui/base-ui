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

// Selector that targets the component INSTANCES themselves (so every occurrence on the page
// gets its own spotlight), not the demo wrapper. ARIA-role selectors match across every site;
// role-less components fall back to shadcn `data-slot` conventions. The capture driver adds a
// demo-wrapper + generic-role fallback when none of these match.
const COMPONENT_SELECTOR = {
  accordion: '[data-slot="accordion"]',
  'alert-dialog': '[data-slot^="alert-dialog"]',
  avatar: '[data-slot="avatar"]',
  button: '[data-slot="button"]',
  'checkbox-group': '[role="checkbox"]',
  checkbox: '[role="checkbox"]',
  collapsible: '[data-slot^="collapsible"]',
  'context-menu': '[data-slot^="context-menu"]',
  drawer: '[data-slot^="drawer"]',
  fieldset: 'fieldset',
  input: '[data-slot="input"]',
  menubar: '[role="menubar"]',
  meter: '[role="meter"]',
  'navigation-menu': '[data-slot^="navigation-menu"]',
  'number-field': '[data-slot^="number-field"]',
  'otp-field': '[data-slot^="input-otp"], [data-slot^="otp"], [autocomplete="one-time-code"]',
  'preview-card': '[data-slot^="preview-card"], [data-slot^="hover-card"]',
  progress: '[role="progressbar"]',
  radio: '[role="radio"]',
  'scroll-area': '[data-slot="scroll-area"]',
  separator: '[role="separator"], [data-slot="separator"], hr',
  slider: '[role="slider"], [data-slot^="slider"]',
  switch: '[role="switch"]',
  tabs: '[role="tablist"]',
  toast: '[data-slot^="toast"]',
  'toggle-group': '[data-slot="toggle-group"]',
  toggle: '[data-slot="toggle"]',
  toolbar: '[role="toolbar"]',
  tooltip: '[data-slot^="tooltip"]',
};
const selectorFor = (c) => COMPONENT_SELECTOR[c] ?? `[data-slot="${c}"]`;

const SITES = {
  '9ui': {
    domain: '9ui.dev',
    url: (c) => `https://www.9ui.dev/docs/components/${NINE_UI_SLUG[c] ?? c}`,
    selector: selectorFor,
  },
  reui: {
    domain: 'reui.io',
    url: (c) => `https://reui.io/components/${c}`,
    selector: selectorFor,
  },
  coss: {
    domain: 'coss.com',
    url: (c) => `https://coss.com/ui/docs/components/${c}`,
    selector: selectorFor,
  },
  lumiui: {
    domain: 'lumiui.dev',
    url: (c) => `https://www.lumiui.dev/docs/components/${LUMIUI_PATH[c]}`,
    selector: selectorFor,
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

// Site-level landing-page captures (`*::domain`). These are used only as a fallback for a
// card whose component the landing capture genuinely depicts — `lookupHighlight` gates the
// fallback by the matched ARIA role (see wildHighlights.ts). We keep only the app-site
// landings whose first Base UI component IS the component of a real docs card: graphql.org
// and kumo-ui.com both surface a Select (role=combobox) that backs their Select cards.
const ROLE_UNION =
  '[role="tablist"], [role="menubar"], [role="switch"], [role="slider"], [role="radiogroup"], [role="checkbox"], [role="combobox"], [role="meter"], [role="progressbar"]';
const SITE_LEVEL = [
  {
    slug: 'graphql-org-hl',
    url: 'https://graphql.org',
    domain: 'graphql.org',
    components: ['Select'],
  },
  {
    slug: 'kumo-ui-com-hl',
    url: 'https://kumo-ui.com',
    domain: 'kumo-ui.com',
    components: ['Select'],
  },
];
for (const t of SITE_LEVEL) {
  targets.push({ ...t, selector: ROLE_UNION });
}

fs.writeFileSync(path.join(dir, 'highlight-targets.json'), `${JSON.stringify(targets, null, 2)}\n`);
console.log(
  `wrote ${targets.length} targets (${targets.length - SITE_LEVEL.length} component + ${SITE_LEVEL.length} site-level) across ${Object.keys(SITES).length} sites`,
);
