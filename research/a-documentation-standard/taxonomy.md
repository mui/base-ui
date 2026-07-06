# Component taxonomy — purpose & information architecture

Replaces the flat A–Z list (the gap named in brief §3.4: "a component is a purpose and an information architecture"). Every reference system categorizes by function: Material's verified purpose set ("action, containment, communication, navigation, selection, and text input"), Polaris's 11 categories ("Actions; Selection and input; Overlays; Navigation; Feedback indicators; …"), GOV.UK's Components-vs-Patterns split. The categories below are derived from Base UI's own API affordances and part grammar (not copied from any reference), and double as the Storybook sidebar hierarchy (`Category/Component`).

## Categories

### 1. Form inputs & selection (14)

The components that capture a value and participate in `<form>` via hidden inputs / native controls, wrapped by the Field/Form machinery. Grammar signature: `value`/`onValueChange` (or `checked`), `name`, `data-invalid`/`data-touched`/`data-dirty` states.

| Component | Placement rationale |
|---|---|
| input | native `<input>` with Field wiring |
| checkbox | boolean form control (see also Binary controls pattern) |
| checkbox-group | multi-value coordination of checkboxes (shares Field labeling) |
| radio (+ radio-group) | mutually exclusive choice; radio-group is the form-participating root — packaging asymmetry: RadioGroup is exported standalone but documented inside Radio's page |
| switch | boolean control with immediate-effect semantics |
| select | picker: closed list, no typing |
| combobox | picker: filterable list (typing filters) |
| autocomplete | picker: free-text input with suggestions |
| slider | numeric/range from a continuum |
| number-field | numeric with increment/decrement + scrub |
| otp-field | segmented one-time-code entry ([New]/Preview) |
| field | labeling/description/error/validation wrapper for ANY control |
| fieldset | grouping + legend for related fields |
| form | submission + server-error distribution root |

*Ambiguity flagged*: `field`/`fieldset`/`form` are form **infrastructure**, not inputs; kept in the same category because their IA purpose (build a form) is identical — subgrouped as "Form infrastructure" in the sidebar if depth allows.

### 2. Overlays & popups (9)

Everything rendered in a Portal above the page, governed by the Portal→(Backdrop)→Positioner→Popup layering grammar (anchored) or Portal→Backdrop→Popup (centered/edge). Grammar signature: `open`/`onOpenChange(value, eventDetails)`, `data-starting-style`/`data-ending-style`, trigger parts, focus management.

| Component | Placement rationale |
|---|---|
| tooltip | anchored, hover/focus, informational, never focusable content |
| popover | anchored, click, interactive content |
| preview-card | anchored, hover, rich link preview |
| dialog | centered, modal-capable, focus-trapped |
| alert-dialog | dialog specialization: interruption requiring a decision (role=alertdialog) |
| drawer | edge-anchored dialog specialization with swipe/detents (Preview lineage: newest overlay) |
| menu | anchored action list (role=menu) — see also category 3 |
| context-menu | menu at pointer position via right-click/long-press |
| toast | self-managed notification stack (createToastManager/useToastManager) |

*Ambiguity flagged*: `menu`/`context-menu` are both "overlays" (mechanics) and "menus" (purpose); the sidebar places them here (their part grammar is the popup grammar), while the **Menus & navigation pattern doc** owns the purpose-level comparison. `toast` could sit in Status & feedback; it lives here because its engineering contract (portal, stacking, timers, swipe) is overlay-shaped — flagged as genuinely arguable.

### 3. Navigation & app chrome (3)

Persistent structures for moving through an app rather than editing state. Grammar signature: link content, `role` ≠ menu (navigation-menu renders links in a `nav`), horizontal composite keyboard movement.

| Component | Placement rationale |
|---|---|
| navigation-menu | site/app navigation with rich flyouts (NOT role=menu — links, APG disclosure-nav shaped) |
| menubar | application menu bar hosting multiple Menus (role=menubar) |
| tabs | switch between peer views in place (role=tablist) |

*Ambiguity flagged*: `tabs` is disclosure-adjacent (shows/hides panels — category 4) but its APG pattern and usage archetype are navigational ("switch views"); placed here, cross-linked from Disclosure. `menubar` hosts menus (category 2 mechanics) but exists to be app chrome.

### 4. Disclosure & structure (4)

Show/hide and organize content in place (no portal, no value).

| Component | Placement rationale |
|---|---|
| collapsible | single show/hide region (Trigger + Panel) |
| accordion | coordinated set of collapsibles (single/multiple open) |
| scroll-area | custom scrollbars over native scrolling |
| separator | semantic divider (role=separator) |

### 5. Actions (4)

Press-shaped controls that trigger behavior rather than hold form value.

| Component | Placement rationale |
|---|---|
| button | native-button semantics wrapper (exists purely for a11y affordances like `focusableWhenDisabled` — mui/base-ui#2363) |
| toggle | two-state press button (`aria-pressed`) |
| toggle-group | exclusive/multiple toggle coordination (single tab stop) |
| toolbar | groups buttons/toggles/inputs into one composite tab stop (role=toolbar) |

*Ambiguity flagged*: `toggle` vs `switch` vs `checkbox` is purpose-adjacent (all binary) — owned by the **Binary controls cluster note** (_clusters/binary-controls.md); the category split follows form participation: switch/checkbox submit values, toggle does not by default.

### 6. Status & display (3)

Read-only reflections of state.

| Component | Placement rationale |
|---|---|
| progress | task completion (role=progressbar, determinate/indeterminate) |
| meter | measurement within known bounds (role=meter — not a task) |
| avatar | image with fallback states |

### 7. Utilities (4 + 1 unstable)

Not rendered UI: library plumbing documented in the docs Utils section.

| Utility | Purpose |
|---|---|
| useRender | build your own render-prop-capable components (the blessed Slot alternative — mui/base-ui#1315→#1418) |
| mergeProps | prop/handler merging with Base UI's rightmost-wins, handlers-before-internals semantics |
| DirectionProvider | RTL behavior coordination (behavior only — does not set `dir`) |
| CSPProvider | nonce/style-injection control for the few style-injecting parts (ScrollArea/Select) |
| unstable-use-media-query | subpath export, no docs page — documented only as an example of `unstable-` semantics (Deliverable B) |

## Count check

14 + 9 + 3 + 4 + 4 + 3 = 37 components (radio-group counted within radio) + 4 documented utils. ✔

## Cross-component patterns (task-level docs, GOV.UK-Patterns-shaped)

Proposed pattern pages that Base UI evidence supports; each spans components and owns the comparative guidance so component pages stay lean:

1. **Build a validated form** — form, field, fieldset + every input component. Evidence: handbook Forms page; native-constraint-validation stance; server-errors flow; support issues on RHF integration (#3552 area). Spine: field wiring → validation modes → server errors → focus-on-error.
2. **Choosing an overlay** — tooltip / popover / preview-card / dialog / alert-dialog / drawer (+ menu for action lists). Evidence: _clusters/overlays.md; #3530 (the maintainer mental model incl. touch behavior); dismissal/modality tables.
3. **Pickers: select vs combobox vs autocomplete** — the filterable-choice decision. Evidence: _clusters/pickers.md; three docs pages' deliberately parallel part grammars.
4. **Menus & navigation** — menu / context-menu / menubar / navigation-menu and when each ARIA pattern applies (role=menu vs links). Evidence: _clusters/menus.md.
5. **Composite keyboard navigation (one tab stop)** — toolbar, menubar, toggle-group, radio-group, tabs: the roving-focus model, arrow-key movement, why Tab skips members. Evidence: composite internals; single-tab-stop philosophy defended in #1996/#3630.
6. **Animating open and close** — every popup + collapsible/accordion: starting/ending styles, keepMounted, actionsRef.unmount, JS-library integration. Evidence: handbook Animation page + the largest support-issue theme cluster (exit animations).

## Sidebar mapping for Storybook

`<Category>/<Component>` titles, categories ordered as above (decision flow: form building first — the dominant real-world archetype in the corpus — then overlays, then chrome/structure/actions/status), plus top-level `Overview/` docs (principles, this taxonomy, pattern pages) and `Utilities/`. Pattern docs land under `Patterns/` as MDX-only pages.
