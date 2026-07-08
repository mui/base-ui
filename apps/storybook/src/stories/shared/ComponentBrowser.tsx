import * as React from 'react';
import styles from './ComponentBrowser.module.css';

/**
 * A browsable, searchable index of every documented Base UI component — a "component
 * browser" in the spirit of coss.com/ui. Each card shows the component name, a one-line
 * description, and a schematic preview, and links to that component's docs page (which
 * leads with its primary story).
 *
 * Rendered by the `Overview/Component browser` MDX page. Because the page runs inside the
 * Storybook docs iframe, card links target `_top` with a manager-rooted `?path=` URL so a
 * click navigates the Storybook manager to the component's docs page.
 */

type Glyph =
  | 'accordion'
  | 'avatar'
  | 'bar'
  | 'button'
  | 'buttons'
  | 'checkbox'
  | 'dialog'
  | 'input'
  | 'lines'
  | 'list'
  | 'radio'
  | 'slider'
  | 'switch'
  | 'tabs';

interface ComponentEntry {
  /** Display name (matches the sidebar leaf). */
  name: string;
  /** Storybook docs page id, e.g. `form-inputs-checkbox` (the `--docs` suffix is added). */
  id: string;
  /** Sidebar category (the segment before `/` in the story title). */
  category: string;
  /** One-line description shown on the card. */
  description: string;
  /** Which schematic preview to draw. */
  glyph: Glyph;
}

// Order the category sections top-to-bottom.
const CATEGORY_ORDER = [
  'Form inputs',
  'Actions',
  'Overlays',
  'Navigation',
  'Disclosure & structure',
  'Status & display',
  'Utilities',
];

// Every documented component + utility. `id` is the Storybook-slugified story title; the
// card links to `?path=/docs/${id}--docs`.
const COMPONENTS: ComponentEntry[] = [
  // Form inputs
  {
    name: 'Autocomplete',
    id: 'form-inputs-autocomplete',
    category: 'Form inputs',
    glyph: 'input',
    description:
      'An input that suggests options as you type — the typed string is the committed value.',
  },
  {
    name: 'Checkbox',
    id: 'form-inputs-checkbox',
    category: 'Form inputs',
    glyph: 'checkbox',
    description:
      'A single toggleable boolean or tri-state (checked / unchecked / indeterminate) value.',
  },
  {
    name: 'Checkbox Group',
    id: 'form-inputs-checkbox-group',
    category: 'Form inputs',
    glyph: 'checkbox',
    description: 'Turns several checkboxes into one array-valued, form-participating field.',
  },
  {
    name: 'Combobox',
    id: 'form-inputs-combobox',
    category: 'Form inputs',
    glyph: 'input',
    description: 'An input combined with a list of predefined items — a filterable Select.',
  },
  {
    name: 'Field',
    id: 'form-inputs-field',
    category: 'Form inputs',
    glyph: 'input',
    description: 'Provides labeling and validation for form controls.',
  },
  {
    name: 'Fieldset',
    id: 'form-inputs-fieldset',
    category: 'Form inputs',
    glyph: 'input',
    description: 'A native fieldset element with an easily stylable legend.',
  },
  {
    name: 'Form',
    id: 'form-inputs-form',
    category: 'Form inputs',
    glyph: 'input',
    description: 'A native form element with consolidated error handling.',
  },
  {
    name: 'Input',
    id: 'form-inputs-input',
    category: 'Form inputs',
    glyph: 'input',
    description: 'A native input element that automatically works with Field.',
  },
  {
    name: 'Number Field',
    id: 'form-inputs-number-field',
    category: 'Form inputs',
    glyph: 'input',
    description: 'A numeric input with increment / decrement buttons and a scrub area.',
  },
  {
    name: 'OTP Field',
    id: 'form-inputs-otp-field',
    category: 'Form inputs',
    glyph: 'input',
    description: 'A one-time password input composed of individual character slots.',
  },
  {
    name: 'Radio',
    id: 'form-inputs-radio',
    category: 'Form inputs',
    glyph: 'radio',
    description: 'A mutually-exclusive, always-visible option picker (paired with Radio Group).',
  },
  {
    name: 'Select',
    id: 'form-inputs-select',
    category: 'Form inputs',
    glyph: 'input',
    description: 'Choose a predefined value from a dropdown menu.',
  },
  {
    name: 'Slider',
    id: 'form-inputs-slider',
    category: 'Form inputs',
    glyph: 'slider',
    description: 'An easily stylable range input.',
  },
  {
    name: 'Switch',
    id: 'form-inputs-switch',
    category: 'Form inputs',
    glyph: 'switch',
    description: 'A toggle for a boolean setting that takes effect immediately.',
  },

  // Actions
  {
    name: 'Button',
    id: 'actions-button',
    category: 'Actions',
    glyph: 'button',
    description: 'A button that can render as another tag or stay focusable when disabled.',
  },
  {
    name: 'Toggle',
    id: 'actions-toggle',
    category: 'Actions',
    glyph: 'button',
    description: 'A two-state button that can be on or off.',
  },
  {
    name: 'Toggle Group',
    id: 'actions-toggle-group',
    category: 'Actions',
    glyph: 'buttons',
    description: 'Provides shared state to a series of toggle buttons.',
  },
  {
    name: 'Toolbar',
    id: 'actions-toolbar',
    category: 'Actions',
    glyph: 'buttons',
    description: 'A container for grouping a set of buttons and controls.',
  },

  // Overlays
  {
    name: 'Alert Dialog',
    id: 'overlays-alert-dialog',
    category: 'Overlays',
    glyph: 'dialog',
    description:
      'A dialog that requires a response to proceed — for destructive-action confirmations.',
  },
  {
    name: 'Context Menu',
    id: 'overlays-context-menu',
    category: 'Overlays',
    glyph: 'list',
    description: 'A menu that appears at the pointer on right click or long press.',
  },
  {
    name: 'Dialog',
    id: 'overlays-dialog',
    category: 'Overlays',
    glyph: 'dialog',
    description: 'A focus-managed, screen-reader-safe modal layer over the page.',
  },
  {
    name: 'Drawer',
    id: 'overlays-drawer',
    category: 'Overlays',
    glyph: 'dialog',
    description: 'A panel that slides in from the edge, with swipe-to-dismiss and snap points.',
  },
  {
    name: 'Menu',
    id: 'overlays-menu',
    category: 'Overlays',
    glyph: 'list',
    description: 'A list of actions in a dropdown, enhanced with keyboard navigation.',
  },
  {
    name: 'Popover',
    id: 'overlays-popover',
    category: 'Overlays',
    glyph: 'dialog',
    description: 'An accessible popup anchored to a button — an anchored mini-dialog.',
  },
  {
    name: 'Preview Card',
    id: 'overlays-preview-card',
    category: 'Overlays',
    glyph: 'dialog',
    description: 'A popup that previews a link when it is hovered.',
  },
  {
    name: 'Toast',
    id: 'overlays-toast',
    category: 'Overlays',
    glyph: 'dialog',
    description: 'A self-managing stack of transient, non-interrupting notifications.',
  },
  {
    name: 'Tooltip',
    id: 'overlays-tooltip',
    category: 'Overlays',
    glyph: 'dialog',
    description: 'A popup hint shown when an element is hovered or focused.',
  },

  // Navigation
  {
    name: 'Menubar',
    id: 'navigation-menubar',
    category: 'Navigation',
    glyph: 'tabs',
    description: 'A persistent `role="menubar"` bar hosting several menus.',
  },
  {
    name: 'Navigation Menu',
    id: 'navigation-navigation-menu',
    category: 'Navigation',
    glyph: 'tabs',
    description: 'A collection of links and menus for website navigation.',
  },
  {
    name: 'Tabs',
    id: 'navigation-tabs',
    category: 'Navigation',
    glyph: 'tabs',
    description: 'Toggle between related panels on the same page.',
  },

  // Disclosure & structure
  {
    name: 'Accordion',
    id: 'disclosure-structure-accordion',
    category: 'Disclosure & structure',
    glyph: 'accordion',
    description: 'A set of collapsible panels with headings.',
  },
  {
    name: 'Collapsible',
    id: 'disclosure-structure-collapsible',
    category: 'Disclosure & structure',
    glyph: 'accordion',
    description: 'A collapsible panel controlled by a button.',
  },
  {
    name: 'Scroll Area',
    id: 'disclosure-structure-scroll-area',
    category: 'Disclosure & structure',
    glyph: 'lines',
    description: 'A native scroll container with custom scrollbars.',
  },
  {
    name: 'Separator',
    id: 'disclosure-structure-separator',
    category: 'Disclosure & structure',
    glyph: 'lines',
    description: 'A separator element accessible to screen readers.',
  },

  // Status & display
  {
    name: 'Avatar',
    id: 'status-display-avatar',
    category: 'Status & display',
    glyph: 'avatar',
    description: "A user's profile picture, initials, or fallback icon.",
  },
  {
    name: 'Meter',
    id: 'status-display-meter',
    category: 'Status & display',
    glyph: 'bar',
    description: 'A graphical display of a numeric value within a range.',
  },
  {
    name: 'Progress',
    id: 'status-display-progress',
    category: 'Status & display',
    glyph: 'bar',
    description: 'Displays the status of a task that takes a long time.',
  },

  // Utilities
  {
    name: 'CSP Provider',
    id: 'utilities-csp-provider',
    category: 'Utilities',
    glyph: 'lines',
    description: 'Configures CSP-related behavior for inline tags Base UI renders.',
  },
  {
    name: 'Direction Provider',
    id: 'utilities-direction-provider',
    category: 'Utilities',
    glyph: 'lines',
    description: 'Enables RTL behavior for Base UI components.',
  },
  {
    name: 'mergeProps',
    id: 'utilities-mergeprops',
    category: 'Utilities',
    glyph: 'lines',
    description: 'A utility to merge multiple sets of React props.',
  },
  {
    name: 'useRender',
    id: 'utilities-userender',
    category: 'Utilities',
    glyph: 'lines',
    description: 'A hook for enabling a render prop in custom components.',
  },
];

/** Manager-rooted path so `_top` navigation lands on the Storybook manager, not the iframe. */
function managerBase(): string {
  try {
    return (window.top ?? window).location.pathname || '/';
  } catch {
    return '/';
  }
}

/** Monochrome schematic previews, coss-style. `currentColor` is set by `.Preview`. */
function GlyphArt({ glyph }: { glyph: Glyph }) {
  const line = { fill: 'currentColor', opacity: 0.45 };
  const solid = { fill: 'currentColor', opacity: 0.85 };
  const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, opacity: 0.55 } as const;
  const strokeStrong = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    opacity: 0.85,
  } as const;

  switch (glyph) {
    case 'accordion':
      return (
        <svg viewBox="0 0 152 84" role="presentation">
          <rect x="20" y="8" width="112" height="18" rx="4" {...stroke} />
          <path d="M116 15 l4 4 4-4" {...strokeStrong} />
          <rect x="20" y="30" width="112" height="30" rx="4" {...stroke} />
          <path d="M116 41 l4-4 4 4" {...strokeStrong} />
          <rect x="30" y="40" width="70" height="4" rx="2" {...line} />
          <rect x="30" y="49" width="52" height="4" rx="2" {...line} />
          <rect x="20" y="64" width="112" height="14" rx="4" {...stroke} />
        </svg>
      );
    case 'avatar':
      return (
        <svg viewBox="0 0 152 84" role="presentation">
          <circle cx="42" cy="42" r="22" {...stroke} />
          <circle cx="42" cy="35" r="8" {...solid} />
          <path d="M27 56 a15 13 0 0 1 30 0" {...solid} />
          <rect x="76" y="32" width="52" height="6" rx="3" {...line} />
          <rect x="76" y="46" width="38" height="6" rx="3" {...line} />
        </svg>
      );
    case 'bar':
      return (
        <svg viewBox="0 0 152 84" role="presentation">
          <rect x="20" y="30" width="112" height="12" rx="6" {...stroke} />
          <rect x="20" y="30" width="66" height="12" rx="6" {...solid} />
          <rect x="20" y="52" width="30" height="5" rx="2.5" {...line} />
          <rect x="112" y="52" width="20" height="5" rx="2.5" {...line} />
        </svg>
      );
    case 'button':
      return (
        <svg viewBox="0 0 152 84" role="presentation">
          <rect x="42" y="30" width="68" height="24" rx="12" {...solid} />
          <rect x="58" y="40" width="36" height="4" rx="2" fill="currentColor" opacity={0.35} />
        </svg>
      );
    case 'buttons':
      return (
        <svg viewBox="0 0 152 84" role="presentation">
          <rect x="18" y="30" width="34" height="24" rx="6" {...solid} />
          <rect x="59" y="30" width="34" height="24" rx="6" {...stroke} />
          <rect x="100" y="30" width="34" height="24" rx="6" {...stroke} />
        </svg>
      );
    case 'checkbox':
      return (
        <svg viewBox="0 0 152 84" role="presentation">
          <rect x="30" y="20" width="16" height="16" rx="4" {...solid} />
          <path
            d="M34 28 l3 3 5-6"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            opacity={0.35}
          />
          <rect x="56" y="26" width="66" height="6" rx="3" {...line} />
          <rect x="30" y="48" width="16" height="16" rx="4" {...stroke} />
          <rect x="56" y="54" width="52" height="6" rx="3" {...line} />
        </svg>
      );
    case 'dialog':
      return (
        <svg viewBox="0 0 152 84" role="presentation">
          <rect x="10" y="8" width="132" height="68" rx="6" fill="currentColor" opacity={0.08} />
          <rect x="34" y="20" width="84" height="44" rx="6" {...strokeStrong} />
          <rect x="44" y="30" width="50" height="6" rx="3" {...line} />
          <rect x="44" y="42" width="64" height="4" rx="2" {...line} />
          <rect x="80" y="52" width="28" height="8" rx="4" {...solid} />
        </svg>
      );
    case 'input':
      return (
        <svg viewBox="0 0 152 84" role="presentation">
          <rect x="20" y="18" width="40" height="5" rx="2.5" {...line} />
          <rect x="20" y="30" width="112" height="24" rx="6" {...stroke} />
          <rect x="30" y="40" width="46" height="5" rx="2.5" {...line} />
          <rect x="79" y="37" width="2" height="12" rx="1" {...solid} />
        </svg>
      );
    case 'lines':
      return (
        <svg viewBox="0 0 152 84" role="presentation">
          <rect x="20" y="24" width="112" height="6" rx="3" {...line} />
          <rect x="20" y="39" width="96" height="6" rx="3" {...line} />
          <rect x="20" y="54" width="72" height="6" rx="3" {...line} />
        </svg>
      );
    case 'list':
      return (
        <svg viewBox="0 0 152 84" role="presentation">
          <rect x="34" y="10" width="84" height="64" rx="6" {...strokeStrong} />
          <rect x="40" y="20" width="72" height="12" rx="4" {...solid} />
          <rect x="48" y="24" width="42" height="4" rx="2" fill="currentColor" opacity={0.3} />
          <rect x="48" y="42" width="52" height="5" rx="2.5" {...line} />
          <rect x="48" y="54" width="44" height="5" rx="2.5" {...line} />
          <rect x="48" y="66" width="36" height="5" rx="2.5" {...line} />
        </svg>
      );
    case 'radio':
      return (
        <svg viewBox="0 0 152 84" role="presentation">
          <circle cx="38" cy="28" r="8" {...strokeStrong} />
          <circle cx="38" cy="28" r="3.5" {...solid} />
          <rect x="56" y="25" width="66" height="6" rx="3" {...line} />
          <circle cx="38" cy="56" r="8" {...stroke} />
          <rect x="56" y="53" width="52" height="6" rx="3" {...line} />
        </svg>
      );
    case 'slider':
      return (
        <svg viewBox="0 0 152 84" role="presentation">
          <rect x="20" y="39" width="112" height="6" rx="3" {...stroke} />
          <rect x="20" y="39" width="60" height="6" rx="3" {...solid} />
          <circle cx="80" cy="42" r="9" {...strokeStrong} />
          <circle cx="80" cy="42" r="4" {...solid} />
        </svg>
      );
    case 'switch':
      return (
        <svg viewBox="0 0 152 84" role="presentation">
          <rect x="42" y="32" width="42" height="20" rx="10" {...solid} />
          <circle cx="74" cy="42" r="7" fill="currentColor" opacity={0.35} />
          <rect x="94" y="38" width="36" height="6" rx="3" {...line} />
        </svg>
      );
    case 'tabs':
      return (
        <svg viewBox="0 0 152 84" role="presentation">
          <rect x="24" y="22" width="30" height="6" rx="3" {...solid} />
          <rect x="62" y="22" width="30" height="6" rx="3" {...line} />
          <rect x="100" y="22" width="28" height="6" rx="3" {...line} />
          <rect x="24" y="33" width="104" height="2" rx="1" fill="currentColor" opacity={0.25} />
          <rect x="24" y="30" width="30" height="3" rx="1.5" {...solid} />
          <rect x="24" y="46" width="80" height="5" rx="2.5" {...line} />
          <rect x="24" y="58" width="60" height="5" rx="2.5" {...line} />
        </svg>
      );
    default:
      return null;
  }
}

export function ComponentBrowser() {
  const [query, setQuery] = React.useState('');
  const base = managerBase();
  const q = query.trim().toLowerCase();

  const filtered = COMPONENTS.filter(
    (c) =>
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q),
  );

  const groups = CATEGORY_ORDER.map((category) => ({
    category,
    items: filtered
      .filter((c) => c.category === category)
      .sort((a, b) => a.name.localeCompare(b.name)),
  })).filter((g) => g.items.length > 0);

  return (
    <div className={styles.Root}>
      <div className={styles.SearchRow}>
        <input
          className={styles.Search}
          type="search"
          placeholder="Search components…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Search components"
        />
        <span className={styles.Count}>
          {filtered.length} of {COMPONENTS.length}
        </span>
      </div>

      {groups.length === 0 ? <p className={styles.Empty}>No components match “{query}”.</p> : null}

      {groups.map((group) => (
        <section key={group.category} className={styles.Section}>
          <h2 className={styles.CategoryHeading}>{group.category}</h2>
          <div className={styles.Grid}>
            {group.items.map((component) => (
              <a
                key={component.id}
                className={styles.Card}
                href={`${base}?path=/docs/${component.id}--docs`}
                target="_top"
              >
                <div className={styles.CardHead}>
                  <span className={styles.CardName}>{component.name}</span>
                  <span className={styles.CardArrow} aria-hidden>
                    →
                  </span>
                </div>
                <p className={styles.CardDesc}>{component.description}</p>
                <div className={styles.Preview}>
                  <GlyphArt glyph={component.glyph} />
                </div>
              </a>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
