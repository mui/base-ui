# Working with Base UI

This project uses [Base UI](https://base-ui.com) (`@base-ui/react`) — a headless,
unstyled React component library. Follow this guidance when writing or changing
components.

## Imports

Components are imported from per-component subpaths, not the package root:

```tsx
import { Combobox } from '@base-ui/react/combobox';
import { Dialog } from '@base-ui/react/dialog';
```

Each subpath exports a single namespace object whose properties are the
component's parts.

## Component anatomy

Base UI components are compound: a root part wraps named child parts. You
assemble them yourself rather than passing a large prop object:

```tsx
<Combobox.Root items={items}>
  <Combobox.Input />
  <Combobox.Portal>
    <Combobox.Positioner>
      <Combobox.Popup>
        <Combobox.List>{/* ... */}</Combobox.List>
      </Combobox.Popup>
    </Combobox.Positioner>
  </Combobox.Portal>
</Combobox.Root>
```

Parts must be nested in the structure the component expects (e.g. a popup lives
inside a portal → positioner → popup chain). Components are headless: they ship
no styles, only behaviour, accessibility, and `data-*` state attributes.

## The installed package is the source of truth

Base UI evolves quickly — part names and props change between releases, and
public documentation or prior knowledge can lag the installed version. **Verify
every API against the installed package, not from memory or the web.**

When you are unsure what a component exports or which props it accepts:

1. Read the subpath's type entry — `node_modules/@base-ui/react/<component>/index.d.ts`
   — and the parts list it re-exports (`index.parts.d.ts`).
2. Read the part's `Props` interface in its `.d.ts` for the exact prop names,
   types, and defaults.
3. Check the `exports` map in `node_modules/@base-ui/react/package.json` to see
   which component subpaths exist.
4. Let `tsc` guide you: a type error on a part or prop name is telling you the
   real API differs from what you assumed — fix it against the types rather
   than working around it with a wrapper.

Never paper over a missing/renamed API with a hand-rolled shim or `as any`. If
the type you expected is not there, the API changed — find the current one.

## Bundled docs in node_modules

The installed `@base-ui/react` package ships its full markdown documentation
under `node_modules/@base-ui/react/docs/react/`. Read these before assembling
parts — composition rules, accessibility wiring, and behaviour are documented
there but are not always expressible in the TypeScript types:

- `docs/react/components/<component>.md` — per-component reference, including
  the canonical Anatomy block (supported nesting of parts).
- `docs/react/handbook/<topic>.md` — cross-cutting topics (animation,
  composition, forms, styling, typescript, customization).
- `docs/react/overview/<topic>.md` — package overview and conventions.

Types tell you *what* exists; the bundled docs tell you *how to compose it*.
Consult the relevant `components/<name>.md` whenever a task involves combining
parts, handling state transitions, or wiring accessibility.
