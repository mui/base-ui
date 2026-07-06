# Cluster: pickers — Select vs Combobox vs Autocomplete

Comparative decision guidance for the three listbox-driven pickers. Referenced by the select/combobox/autocomplete briefs. Mined 2026-07-06.

## What each is for (docs' own words)

- **Select** — "A common form component for choosing a predefined value in a dropdown menu" [E] (`docs/.../select/page.mdx` Subtitle). A button trigger + listbox popup; no text input anywhere. Value persists and submits with forms.
- **Combobox** — "An input combined with a list of predefined items to select" [E] (`docs/.../combobox/page.mdx` Subtitle). "Combobox is a filterable Select": the input filters, but the committed value is restricted to the predefined items [E] (combobox Usage guidelines).
- **Autocomplete** — "An input that suggests options as you type" [E] (`docs/.../autocomplete/page.mdx` Subtitle). Free-form text is the value; the list only *suggests*/optionally completes it [E] (autocomplete Usage guidelines).

Shared lineage: Combobox and Autocomplete shipped together in one PR (mui/base-ui#2105, atomiks, merged 2025-09-03, closing #222); a `FilterableMenu` sibling was previewed there and deferred [E]. Select predates them (#541, 2024-11-14).

## Decision table

| Question | Select | Combobox | Autocomplete |
|---|---|---|---|
| Filterable by typing? | No — keyboard typeahead only [E] (select Usage guidelines) | Yes — that's its reason to exist [E] | Yes — filtering is the interaction [E] |
| Free-form text allowed? | No | No — "Combobox does not allow free-form text input" [E] (combobox guidelines) | Yes — "input can contain free-form text" [E] |
| Selection state remembered? | Yes (`value`) | Yes (`value`, separate from input text) | No committed selection — "Avoid when selection state is needed: use Combobox" [E] (autocomplete guidelines) |
| Renders a text input? | Never — "Use Select instead of Combobox if no input is being rendered" [E] (combobox guidelines) | Yes (outside or inside the popup) | Yes (it *is* the control) |
| `multiple`? | Yes (#2173) [E] | Yes — plus `Chips`/`Chip`/`ChipRemove` parts for tokenized display [E] (combobox Anatomy) | n/a (value is text) [I from API] |
| Built-in Clear button? | No — "native HTML and OS [selects] just don't have a clear button" [E] (mj12albert, mui/base-ui#2734) | Yes (`Combobox.Clear`; deliberately not tabbable, one tab stop per field, mui/base-ui#3630) [E] | Yes (`Autocomplete.Clear`) [E] (Anatomy) |
| Async/large options? | Discouraged — "Prefer Combobox when the number of items is sufficiently large to warrant filtering" [E] (select guidelines) | Yes — `Status`/`Empty` parts, async patterns documented [E] (combobox Anatomy/examples) | Yes — "Async search" documented example [E] (autocomplete page) |
| Extra niche | Item-aligned macOS-style positioning (`alignItemWithTrigger`) [E] | Input-inside-popup pattern (trigger is the form control, labeled by `Combobox.Label`) [E] (combobox guidelines) | "Can be used for filterable command pickers" (command palette) [E] (autocomplete guidelines) |
| Focus model | Items receive real DOM focus [E] (SelectRoot has no virtual focus; highlight follows focus, #2569) | Virtual focus — input keeps DOM focus, items only highlighted (`data-highlighted` unified for hover+keyboard) [E] (mui/base-ui#2731, mj12albert/atomiks) | Same virtual-focus model as Combobox [I — shares combobox internals, #2105] |
| ARIA shape | Trigger `role="combobox"` (a button) + popup `role="listbox"` — APG *select-only combobox* [E] (mui/base-ui#4754, atomiks) | Input `role="combobox"` + listbox; editable APG combobox pattern [I from API + #3630 "matches ARIA combobox pattern"] | Editable combobox with list autocomplete [I] |

## The boundary in maintainers' words

- [E] "Combobox is a filterable Select: … Prefer using Combobox over Select when the number of items is sufficiently large to warrant filtering." — combobox docs Usage guidelines (mirror statement on the select page).
- [E] "Avoid when not rendering an input: Use Select instead of Combobox if no input is being rendered, which includes accessibility features specific to a listbox without an input." — combobox docs Usage guidelines. This is the *anatomy-driven* rule: the presence of a visible text input decides the component.
- [E] "Avoid for simple search widgets: Combobox does not allow free-form text input. For search widgets, consider using Autocomplete instead." — combobox docs Usage guidelines. Free-text decides Combobox vs Autocomplete.
- [E] Clear-without-filter is acknowledged gray area: "This seems to exist in a kind of gray area between two use cases. It seems unlikely… that the listbox would be long enough that a clear button would be useful, but not long enough to warrant a filter input." (colmtuite, mui/base-ui#2734, open). mj12albert's suggested recipe there: a Combobox with `Trigger`+`Value`+`Clear` and **no input** — i.e. Combobox parts can be composed into a "clearable select".
- [E] Long-term convergence is on the record but not planned: oliviertassinari relays diegohaz — "at some point I want a single Combobox component that can also serve as a Select, since Select is technically a combobox" (mui/base-ui#2734). Treat as sentiment, not roadmap.
- [E] Scope guardrails shared by the trio: no tree-of-checkboxes ("trees are out of combobox scope", mj12albert, mui/base-ui#2695); "select all" rows are userland recipes because a listbox may only contain options (mui/base-ui#4927).

## Practical decision path (derived)

[I] Synthesis of the [E] statements above:

1. Does the user type text that is itself the answer (search box, tags with novel values)? → **Autocomplete**.
2. Is there a visible text input for filtering a fixed set? → **Combobox**.
3. Neither (button + list of predefined values, form-friendly, typeahead is enough)? → **Select**.
4. Need Clear-on-a-select or other input-less Combobox affordances? → Combobox composed without an input (per #2734), or a controlled Select with an external clear control.
5. The popup performs *actions* rather than picking a persisted value? → none of these — **Menu** ("A list of actions in a dropdown", menu docs Subtitle).

## Related cross-references

- Select brief §4 (when not to use), §7 (select-only combobox ARIA); combobox/autocomplete briefs to link here.
- Shared machinery: all three use Portal→Positioner→Popup layering, `items`/object-values/`isItemEqualToValue`/`itemToStringLabel|Value` props (several PRs land on select+combobox together: #2704, #3604, #4005, #4056), and the eventDetails contract (#2382).
- [G] No maintainer statement found ranking Select vs Combobox on *mobile/touch* specifically (searched issues for "select touch combobox") — only Select's own touch behaviors are documented (select brief §6).
