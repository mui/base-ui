---
productId: base-ui
title: React Checkbox component and hook
components: Checkbox, CheckboxIndicator
hooks: useCheckbox
githubLabel: 'component: checkbox'
waiAria: https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/
---

# Checkbox

<p class="description">Checkboxes give users binary choices when presented with multiple options in a series.</p>

{{"component": "modules/components/ComponentLinkHeader.js", "design": false}}

{{"component": "modules/components/ComponentPageTabs.js"}}

## Introduction

The Checkbox component provides users with a checkbox for toggling a checked state.

{{"demo": "UnstyledCheckboxIntroduction", "defaultCodeOpen": false, "bg": "gradient"}}

## Component

```jsx
import { Checkbox } from '@mui/base/Checkbox';
```

### Anatomy

The `Checkbox` component is composed of a root component and an indicator child component:

```tsx
<Checkbox>
  <Checkbox.Indicator />
</Checkbox>
```

The indicator can contain children, such as an icon:

```tsx
<Checkbox>
  <Checkbox.Indicator>
    <MyCheckIcon />
  </Checkbox.Indicator>
</Checkbox>
```

The indicator conditionally unmounts its children when the checkbox is unchecked. For CSS animations, you can use the `keepMounted` prop to transition `visibility` and `opacity` for example:

```tsx
<Checkbox>
  <Checkbox.Indicator keepMounted>
    <MyCheckIcon />
  </Checkbox.Indicator>
</Checkbox>
```

### Custom structure

Use the `render` prop to override the rendered checkbox or indicator element with your own components:

```jsx
<Checkbox render={(props) => <MyCheckbox {...props} />}>
  <Checkbox.Indicator render={(props) => <MyCheckboxIndicator {...props} />} />
</Checkbox>
```

To ensure behavior works as expected:

- **Forward all props**: Your component should spread all props to the underlying element.
- **Forward the `ref`**: Your component should use [`forwardRef`](https://react.dev/reference/react/forwardRef) to ensure the Checkbox components can access the element via a ref.

A custom component that adheres to these two principles looks like this:

```jsx
const MyCheckbox = React.forwardRef(function MyCheckbox(props, ref) {
  return <button ref={ref} {...props} />;
});
```

### Indeterminate state

To make the checkbox indeterminate, add the `indeterminate` prop to override the appearance of the checkbox. The checkbox remains in an indeterminate state regardless of user interaction until set back to `false`.

{{"demo": "UnstyledCheckboxIndeterminate.js"}}

An indeterminate checkbox's main use case is representing the state of a parent checkbox where only some of its children are checked:

{{"demo": "UnstyledCheckboxIndeterminateGroup.js", "defaultCodeOpen": false}}

It's a **visual-only** state, so it can still have its internal `checked` state change.

## Hook

```js
import { useCheckbox } from '@mui/base/useCheckbox';
```

The `useCheckbox` hook lets you apply the functionality of a Checkbox to a fully custom component.
It returns props to be placed on the custom component, along with fields representing the component's internal state.

:::info
Hooks give you the most room for customization, but require more work to implement.
With hooks, you can take full control over how your component is rendered, and define all the custom props and CSS classes you need.

You may not need to use hooks unless you find that you're limited by the customization options of their component counterparts—for instance, if your component requires significantly different [HTML structure](#anatomy).
:::

## Accessibility

Ensure the checkbox has an accessible name via a `label` element.

```jsx
<Checkbox id="my-checkbox">
  <Checkbox.Indicator />
</Checkbox>
<label htmlFor="my-checkbox">
  My label
</label>
```
