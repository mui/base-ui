# Base UI

Imports always use subpaths:
`import { X } from '@base-ui/react/<component>'`. Never import
from `@base-ui/react` directly.

Components are top-level directories under
`node_modules/@base-ui/react/` (e.g. `combobox/`, `callout/`).
Each one ships an `index.parts.d.ts` whose JSDoc preamble
documents the anatomy.
