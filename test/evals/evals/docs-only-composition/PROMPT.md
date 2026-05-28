# Build a fruit-picker combobox with recent-search fallback

This project uses Base UI (`@base-ui/react`). Build a single-page React app: a
fruit picker that lets the user filter and choose one fruit from a list.

## Behaviour

- Edit `src/App.tsx` so it default-exports an `App` component.
- `App` renders a labelled text field. As the user types, a dropdown list
  appears showing only the fruits whose names match what was typed.
- Offer at least 8 fruits. Each fruit has a display label and a value.
- Choosing a fruit from the list fills the field with that fruit.
- When the typed text matches no fruit, the dropdown shows a "Recent
  searches" affordance in place of the standard empty state, displaying
  three example recent search terms (e.g. `"apple"`, `"banana"`,
  `"cherry"`).
- Use Base UI's combobox component for all of this — do not hand-roll the
  filtering, dropdown, empty-state announcement, or accessibility
  behaviour, and do not implement the recent-searches affordance with a
  plain `<div>` if the combobox provides a dedicated part for it.

## Constraints

- No styling is required — focus on correct structure and behaviour.
- `npm run build` (which runs `tsc`) must succeed with no type errors.
