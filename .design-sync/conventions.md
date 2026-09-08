## Base UI conventions

Base UI is **headless/unstyled by design** — it ships zero CSS. Every rendered
part is real DOM (a `button`, `input`, `div`, etc. via a `render` prop or
plain default tag) with no default appearance. You MUST supply all visual
styling yourself; an unstyled Base UI component renders as invisible/native
browser chrome.

### No provider required for most components

Most components need no wrapper — `<Switch.Root>`, `<Accordion.Root>`, etc.
work standalone. Two real exceptions:
- `DirectionProvider` — wrap a subtree in `<DirectionProvider direction="rtl">`
  to mirror layout/positioning (menus, tooltips, sliders) for RTL locales.
- `CSPProvider` — wrap the app in `<CSPProvider nonce="...">` only when the
  host page enforces a strict Content-Security-Policy that blocks inline
  styles; has no visual effect otherwise.
Everything else composes directly.

### The styling idiom: target real DOM + state data-attributes

There are no CSS classes or theme tokens to reach for — style with your own
classNames/CSS (or a style prop) targeting the plain DOM elements Base UI
renders, and react to component STATE via the `data-*` attributes Base UI
sets on those elements (never inspect internal state directly). Verified
attribute names actually set by components in this bundle — use these, don't
invent new ones:

| Attribute | Meaning | Seen on |
|---|---|---|
| `data-checked` / `data-unchecked` / `data-indeterminate` | Checkbox/Switch/Radio state | Checkbox, Switch, Radio |
| `data-disabled` | Disabled state | almost every interactive part |
| `data-open` / `data-closed` | Open/closed (popups, collapsible) | Dialog, Popover, Menu, Collapsible, Select... |
| `data-panel-open` | Accordion panel expanded | Accordion.Trigger |
| `data-starting-style` / `data-ending-style` | Enter/exit transition phase — animate FROM this state | any transitioning part |
| `data-pressed` | Toggle pressed state | Toggle, ToggleGroup item |
| `data-selected` / `data-highlighted` | List/menu item selection & keyboard highlight | Menu.Item, Select item, Combobox item, Tabs.Tab |
| `data-side` | Which side a popup positioned on (`top`/`bottom`/`left`/`right`/`none`) | Popover/Menu/Select/Tooltip positioner |
| `data-invalid` / `data-valid` / `data-dirty` / `data-touched` | Field/form validation state | Field, Input, form controls |
| `data-required` / `data-readonly` | Field control flags | Field, Input |
| `data-orientation` | `horizontal`/`vertical` | Slider, Tabs, Toolbar, Separator, ScrollArea |
| `data-scrubbing` / `data-dragging` | Active pointer interaction | Slider, NumberField |
| `data-placeholder` | Empty/placeholder state | Select, Combobox trigger |
| `data-empty` | Empty collection/value | Select, Combobox |

Example (Switch, ported directly from a verified preview):
```css
.Switch { border: 1px solid #111; padding: 2px; width: 36px; height: 20px; }
.Switch[data-checked] { background-color: #111; }
.Switch[data-disabled] { opacity: 0.4; }
```

### Compound components — always import the namespace from the root

Every multi-part component (`Accordion`, `Dialog`, `Menu`, `Select`, ...) is
a namespace object: `import { Accordion } from '@base-ui/react'`, then use
`<Accordion.Root>`, `<Accordion.Item>`, `<Accordion.Trigger>`, etc. — never a
flat `AccordionRoot` import. A leaf part (`Item`, `Trigger`, `Panel`) only
renders correctly inside its full parent tree — always compose the whole
compound, never a part in isolation.

### Where the truth lives

- Each component's `<Name>.d.ts` in this bundle names its exported parts.
- Each component's `<Name>.prompt.md` carries real, working usage examples
  (ported from Base UI's own docs hero demos) — the most reliable reference
  for how a specific compound's parts fit together and which `data-*`
  attributes it actually sets.
- `styles.css` in this bundle is intentionally near-empty (headless DS) —
  don't look there for visual reference; look at a `.prompt.md` example.

### Overlay components (Dialog, Popover, Menu, Select, Tooltip, ...)

These render into a `Portal` and need explicit positioning styles on their
`Popup`/`Positioner` part (e.g. `position: fixed`, or rely on the built-in
floating-ui positioning already applied inline) plus a `Backdrop` for modal
ones. Copy the pattern from the component's own `.prompt.md` example rather
than inventing overlay CSS from scratch.
