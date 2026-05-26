---
name: base-ui
description: Build React UIs with Base UI (@base-ui/react) headless components — import conventions, compound component anatomy, and how to verify the current API against the installed package.
---

# Base UI

[Base UI](https://base-ui.com) (`@base-ui/react`) is a headless, unstyled React
component library. Use this skill whenever a task involves `@base-ui/react`.

## Imports

Import from per-component subpaths, never the package root. Each subpath exports
one namespace object:

```tsx
import { Combobox } from '@base-ui/react/combobox';
```

## Component anatomy

Components are compound — a root part wraps named child parts that you assemble
yourself:

```tsx
<Combobox.Root items={items}>
  <Combobox.Input />
  <Combobox.Portal>
    <Combobox.Positioner>
      <Combobox.Popup>
        <Combobox.List>{/* render items */}</Combobox.List>
      </Combobox.Popup>
    </Combobox.Positioner>
  </Combobox.Portal>
</Combobox.Root>
```

Parts must follow the nesting the component expects. Components are headless:
they ship behaviour, accessibility, and `data-*` state attributes — no styles.

## Verifying the API (do this every time)

Base UI changes part names and props between releases; training data and public
docs lag the installed version. **Always confirm the API against the installed
package before writing code:**

1. Open `node_modules/@base-ui/react/<component>/index.d.ts` and its
   `index.parts.d.ts` to see the exact parts a component exposes.
2. Open a part's `.d.ts` to read its `Props` interface — exact prop names,
   types, defaults.
3. Check `node_modules/@base-ui/react/package.json` `exports` for which
   component subpaths exist.
4. Treat `tsc` errors as API signals: a rejected part or prop name means the
   real API differs from your assumption — correct it against the types.

Do not work around an unexpected/renamed API with a wrapper component or
`as any`. If an export or prop is missing, the API moved — locate the current
one in the package types.
