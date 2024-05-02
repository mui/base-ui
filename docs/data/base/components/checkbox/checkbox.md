---
productId: base-ui
title: React Checkbox component and hook
components: CheckboxRoot, CheckboxIndicator
hooks: useCheckbox
githubLabel: 'component: checkbox'
waiAria: https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/
---

# Checkbox

<p class="description">Checkbox give users a binary choice between multiple options in a series.</p>

{{"component": "modules/components/ComponentLinkHeader.js", "design": false}}

{{"component": "modules/components/ComponentPageTabs.js"}}

{{"demo": "UnstyledCheckboxIntroduction", "defaultCodeOpen": false, "bg": "gradient"}}

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
import * as Checkbox from '@base_ui/react/Checkbox';
```

## Anatomy

Checkbox is composed of two components.

- `<Checkbox.Root />` renders a `<button>`.
- `<Checkbox.Indicator />` renders a `<span>` for providing a visual indicator. You could place an icon inside this component.

```tsx
<Checkbox.Root>
  <Checkbox.Indicator />
</Checkbox.Root>
```

## Overriding default components

Use the `render` prop to override the rendered checkbox or indicator element with your own components.

```jsx
<Checkbox.Root render={(props) => <MyCheckbox {...props} />}>
  <Checkbox.Indicator render={(props) => <MyCheckboxIndicator {...props} />} />
</Checkbox.Root>
```

## Indeterminate state

To make the checkbox indeterminate, add the `indeterminate` prop to override the appearance of the checkbox. The checkbox remains in an indeterminate state regardless of user interaction until set back to `false`.

{{"demo": "UnstyledCheckboxIndeterminate.js"}}

The primary use case for an indeterminate checkbox is representing the state of a parent checkbox where only some of its children are checked.

{{"demo": "UnstyledCheckboxIndeterminateGroup.js", "defaultCodeOpen": false}}

It's a _visual-only_ state, so its internal `checked` state can still be changed.

## Accessibility

Ensure the checkbox has an accessible name via a `<label>` element.

```jsx
<Checkbox.Root id="my-checkbox">
  <Checkbox.Indicator />
</Checkbox.Root>
<label htmlFor="my-checkbox">
  My label
</label>
```
