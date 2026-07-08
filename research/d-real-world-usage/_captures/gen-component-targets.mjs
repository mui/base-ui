// Generates highlight-targets.json for the per-component "in the wild" pass: one target per
// (showcase-site, Base UI component) docs card, pointing at that component's OWN page on the
// site and selecting its live demo. Discovered patterns (2026-07-08):
//   - 9ui.dev    /docs/components/<slug>        (SLUG_9UI overrides)
//   - reui.io    /components/<slug>             (SLUG_REUI overrides)
//   - coss.com   /ui/docs/components/<slug>     (SLUG_COSS overrides)
//   - lumiui.dev /docs/components/<cat>/<slug>  (LUMIUI_PATH, categorized)
// Each site follows the shadcn `data-slot` convention, so demo elements are selected by a
// component-specific `[data-slot^="…"]` (see COMPONENT_SELECTOR); role-based selectors are
// used where a role is cleaner (checkbox/switch/slider/…).
//
//   node research/d-real-world-usage/_captures/gen-component-targets.mjs
//
// EXPAND controls which components are (re)captured this run. Components not in EXPAND keep
// their existing captures via the manifest merge in capture-highlight.mjs, so a partial run
// only touches the components being expanded.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const nice = (c) =>
  c.replace(/(^|-)([a-z])/g, (_, s, ch) => (s ? ' ' : '') + ch.toUpperCase()).trim();

// component → sites that have a docs page for it (verified against each site's sitemap /
// component index, 2026-07-08).
const MATRIX = {
  accordion: ['9ui', 'lumiui', 'reui'],
  'alert-dialog': ['9ui', 'lumiui'],
  autocomplete: ['9ui', 'reui', 'coss', 'lumiui'],
  avatar: ['9ui', 'lumiui', 'reui'],
  button: ['9ui', 'reui', 'coss', 'lumiui'],
  'checkbox-group': ['9ui', 'coss', 'lumiui'],
  checkbox: ['coss', 'reui'],
  collapsible: ['9ui', 'reui', 'coss', 'lumiui'],
  combobox: ['9ui', 'reui', 'coss', 'lumiui'],
  'context-menu': ['coss', 'lumiui', 'reui'],
  dialog: ['9ui', 'reui', 'coss', 'lumiui'],
  drawer: ['coss', 'reui'],
  field: ['reui', 'coss', 'lumiui'],
  fieldset: ['coss', 'lumiui'],
  form: ['9ui', 'coss', 'lumiui'],
  input: ['9ui', 'reui', 'coss', 'lumiui'],
  menu: ['9ui', 'reui', 'coss', 'lumiui'],
  menubar: ['9ui', 'reui', 'lumiui'],
  meter: ['9ui', 'lumiui'],
  'navigation-menu': ['9ui', 'lumiui'],
  'number-field': ['9ui', 'coss', 'lumiui'],
  'otp-field': ['9ui', 'coss', 'lumiui'],
  popover: ['9ui', 'reui', 'coss', 'lumiui'],
  'preview-card': ['9ui', 'coss', 'lumiui'],
  progress: ['9ui', 'coss', 'lumiui'],
  radio: ['9ui', 'reui', 'coss', 'lumiui'],
  'scroll-area': ['9ui', 'lumiui', 'reui'],
  select: ['9ui', 'reui', 'coss', 'lumiui'],
  separator: ['9ui', 'lumiui'],
  slider: ['9ui', 'coss', 'lumiui'],
  switch: ['9ui', 'reui', 'coss', 'lumiui'],
  tabs: ['9ui', 'reui', 'coss', 'lumiui'],
  toast: ['9ui', 'coss', 'lumiui'],
  'toggle-group': ['9ui', 'lumiui'],
  toggle: ['coss', 'reui'],
  toolbar: ['9ui', 'lumiui'],
  tooltip: ['9ui', 'reui', 'coss', 'lumiui'],
};

// Only (re)capture these this run — the components that had 0 or 1 highlight. Everything else
// keeps its existing captures via the manifest merge. Set to `null` to capture the whole MATRIX.
const EXPAND = new Set([
  'autocomplete',
  'button',
  'collapsible',
  'combobox',
  'dialog',
  'field',
  'form',
  'input',
  'menu',
  'menubar',
  'popover',
  'radio',
  'select',
  'switch',
  'tabs',
  'toast',
  'tooltip',
]);

// Per-site URL-slug overrides (Base UI name → site slug). Default is the Base UI name.
const SLUG_9UI = { 'otp-field': 'input-otp', radio: 'radio-group', menu: 'dropdown-menu' };
const SLUG_REUI = { 'otp-field': 'input-otp', radio: 'radio-group', menu: 'dropdown-menu' };
const SLUG_COSS = { radio: 'radio-group' };

// lumiui categorized paths (Base UI name → `<category>/<slug>`).
const LUMIUI_PATH = {
  accordion: 'layout-nav/accordion',
  'alert-dialog': 'overlays-dialogs/alert-dialog',
  autocomplete: 'form-input/autocomplete',
  avatar: 'display-media/avatar',
  button: 'form-input/button',
  'checkbox-group': 'form-input/checkbox-group',
  collapsible: 'misc/collapsible',
  combobox: 'form-input/combobox',
  'context-menu': 'overlays-dialogs/context-menu',
  dialog: 'overlays-dialogs/dialog',
  field: 'form-input/field',
  fieldset: 'form-input/fieldset',
  form: 'form-input/form',
  input: 'form-input/input',
  menu: 'overlays-dialogs/dropdown-menu',
  menubar: 'misc/menubar',
  meter: 'feedback-status/meter',
  'navigation-menu': 'layout-nav/navigation-menu',
  'number-field': 'form-input/number-field',
  'otp-field': 'form-input/otp-field',
  popover: 'overlays-dialogs/popover',
  'preview-card': 'overlays-dialogs/preview-card',
  progress: 'feedback-status/progress',
  radio: 'form-input/radio',
  'scroll-area': 'layout-nav/scroll-area',
  select: 'form-input/select',
  separator: 'layout-nav/separator',
  slider: 'form-input/slider',
  switch: 'form-input/switch',
  tabs: 'layout-nav/tabs',
  toast: 'feedback-status/toast',
  'toggle-group': 'misc/toggle-group',
  toolbar: 'misc/toolbar',
  tooltip: 'overlays-dialogs/tooltip',
};

// Selector that targets the component INSTANCES themselves (so every occurrence on the page
// gets its own spotlight), not the demo wrapper. Prefer component-specific shadcn `data-slot`
// prefixes (which stay within the demo, avoiding the site's own chrome such as the header
// search combobox); use a role where it's cleaner. Overlay triggers (dialog/menu/popover/
// tooltip) are matched by their `data-slot` trigger, which is visible when the overlay is
// closed. The capture driver adds a demo-wrapper + generic-role fallback when none match.
const COMPONENT_SELECTOR = {
  accordion: '[data-slot="accordion"]',
  'alert-dialog': '[data-slot^="alert-dialog"]',
  autocomplete: '[data-slot^="autocomplete"]',
  avatar: '[data-slot="avatar"]',
  button: '[data-slot="button"]',
  'checkbox-group': '[role="checkbox"]',
  checkbox: '[role="checkbox"]',
  collapsible: '[data-slot^="collapsible"]',
  combobox: '[data-slot^="combobox"]',
  'context-menu': '[data-slot^="context-menu"]',
  dialog: '[data-slot^="dialog"]',
  drawer: '[data-slot^="drawer"]',
  field: '[data-slot^="field"]',
  fieldset: 'fieldset',
  form: 'form',
  input: '[data-slot="input"]',
  menu: '[data-slot^="dropdown-menu"], [data-slot^="menu"]',
  menubar: '[role="menubar"]',
  meter: '[role="meter"]',
  'navigation-menu': '[data-slot^="navigation-menu"]',
  'number-field': '[data-slot^="number-field"]',
  'otp-field': '[data-slot^="input-otp"], [data-slot^="otp"], [autocomplete="one-time-code"]',
  popover: '[data-slot^="popover"]',
  'preview-card': '[data-slot^="preview-card"], [data-slot^="hover-card"]',
  progress: '[role="progressbar"]',
  radio: '[role="radio"]',
  'scroll-area': '[data-slot="scroll-area"]',
  select: '[data-slot^="select"]',
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
    url: (c) => `https://www.9ui.dev/docs/components/${SLUG_9UI[c] ?? c}`,
    selector: selectorFor,
  },
  reui: {
    domain: 'reui.io',
    url: (c) => `https://reui.io/components/${SLUG_REUI[c] ?? c}`,
    selector: selectorFor,
  },
  coss: {
    domain: 'coss.com',
    url: (c) => `https://coss.com/ui/docs/components/${SLUG_COSS[c] ?? c}`,
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
  if (EXPAND && !EXPAND.has(component)) {
    continue;
  }
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
      selector: site.selector(component),
    });
  }
}

// Site-level landing-page captures (`*::domain`). Used only as a fallback for a card whose
// component the landing capture genuinely depicts — `lookupHighlight` gates the fallback by
// the matched ARIA role (see wildHighlights.ts). Kept: graphql.org + kumo-ui.com both surface
// a Select (role=combobox) that backs their Select cards.
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
  `wrote ${targets.length} targets (${targets.length - SITE_LEVEL.length} component + ${SITE_LEVEL.length} site-level); EXPAND=${EXPAND ? [...EXPAND].length : 'all'}`,
);
