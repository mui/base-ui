---
productId: base-ui
title: React Checkbox Group component and hook
components: CheckboxGroupRoot
githubLabel: 'component: checkbox'
waiAria: https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/
packageName: '@base_ui/react'
---

# Checkbox Group

<p class="description">Checkbox Groups combine a series of checkboxes together.</p>

{{"component": "@mui/docs/ComponentLinkHeader", "design": false}}

{{"component": "modules/components/ComponentPageTabs.js"}}

{{"demo": "UnstyledCheckboxGroupIntroduction", "defaultCodeOpen": false, "bg": "gradient"}}

## Installation

Base UI components are all available as a single package.

<codeblock storageKey="package-manager">

```bash npm
npm install @base_ui/react
```

```bash yarn
yarn add @base_ui/react
```

```bash pnpm
pnpm add @base_ui/react
```

</codeblock>

Once you have the package installed, import the component.

```ts
import * as CheckboxGroup from '@base_ui/react/CheckboxGroup';
```

## Anatomy

Checkbox Group is composed of a `Root` component and `Checkbox` components:

- `<CheckboxGroup.Root />` renders a `<div>` with a `group` role.
- `<Checkbox.Root />` renders an individual `<button>` checkbox.

```tsx
<CheckboxGroup.Root>
  <Checkbox.Root />
  <Checkbox.Root />
</CheckboxGroup.Root>
```

## Labeling

`Field` components are used to label the Checkbox Group and individual Checkboxes:

```jsx
import * as Field from '@base_ui/react/Field';
```

```tsx
<Field.Root>
  <CheckboxGroup.Root>
    <Field.Label>Colors</Field.Label>
    <Field.Root>
      <Checkbox.Root name="red" />
      <Field.Label>Red</Field.Label>
    </Field.Root>
    <Field.Root>
      <Checkbox.Root name="blue" />
      <Field.Label>Blue</Field.Label>
    </Field.Root>
  </CheckboxGroup.Root>
</Field.Root>
```

## Controlled

The `value` and `onValueChange` props control the Checkbox Group with external state. `value` is an array of strings matching the `name` props of Checkboxes that are currently checked:

```jsx
const [value, setValue] = useState(['red']);

return (
  <CheckboxGroup.Root value={value} onValueChange={setValue}>
    <Checkbox.Root name="red" /> {/* Checked */}
    <Checkbox.Root name="green" />
    <Checkbox.Root name="blue" />
  </CheckboxGroup.Root>
);
```

## Parent Checkbox

A Checkbox can control a group of child Checkboxes.

1. Make `CheckboxGroup.Root` controlled and add `allValues` as a prop — an array of strings that contains the names of all the child checkboxes.
2. Add a `parent` prop to the `Checkbox.Root` component that controls the other (child) Checkboxes inside the group.
3. Give the child Checkboxes a `name` prop that identifies them inside the `allValues` array.

```jsx
const allValues = ['a', 'b', 'c'];

function App() {
  const [value, setValue] = useState([]);
  return (
    <CheckboxGroup.Root value={value} onValueChange={setValue} allValues={allValues}>
      <Checkbox.Root parent />
      {allValues.map((value) => (
        <Checkbox.Root key={value} name={value} />
      ))}
    </CheckboxGroup.Root>
  );
}
```

{{"demo": "UnstyledCheckboxGroupNested.js"}}

To preserve the initial state of the child checkboxes when the parent checkbox is clicked to prevent their state from being lost, set the `preserveChildStates` prop to `true`:

```tsx
<CheckboxGroup.Root preserveChildStates>
  <Checkbox.Root parent />
  {allValues.map((value) => (
    <Checkbox.Root key={value} name={value} />
  ))}
</CheckboxGroup.Root>
```
