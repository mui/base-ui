# Build a fruit-picker combobox

This project uses Base UI (`@base-ui/react`). Build a single-page React app: a
fruit picker that lets the user filter and choose one fruit from a list.

## Behaviour

- Edit `src/App.tsx` so it default-exports an `App` component.
- `App` renders a labelled text field. As the user types, a dropdown list
  appears showing only the fruits whose names match what was typed.
- Offer at least 8 fruits. Each fruit has a display label and a value.
- Choosing a fruit from the list fills the field with that fruit.
- Inside the field, include a button that empties it back to nothing. When the
  user empties the field with that button, the open dropdown list must also
  close.
- An empty-state message shows when nothing matches.

## Constraints

- No styling is required — focus on correct structure and behaviour.
- `npm run build` (which runs `tsc`) must succeed with no type errors.
