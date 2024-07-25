---
productId: base-ui
title: React Radio Group component
components: RadioGroupRoot, RadioGroupItem, RadioGroupIndicator
githubLabel: 'component: radio'
waiAria: https://www.w3.org/WAI/ARIA/apg/patterns/radio/
---

# Radio Group

<p class="description">Radio Groups contain a set of checkable (radio) buttons where only one of the buttons can be checked at a time.</p>

{{"component": "@mui/docs/ComponentLinkHeader", "design": false}}

{{"component": "modules/components/ComponentPageTabs.js"}}

## Introduction

{{"demo": "UnstyledRadioGroupIntroduction", "defaultCodeOpen": false, "bg": "gradient"}}

## Installation

Base UI components are all available as a single package.

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
import * as RadioGroup from '@base_ui/react/RadioGroup';
```

## Anatomy

Radio Group is composed of a collection of related components:

- `<RadioGroup.Root />` is a top-level element that wraps the other components.
- `<RadioGroup.Item />` renders an individual `<button>` radio item.
- `<RadioGroup.Indicator />` renders a `<div>` for providing a visual indicator. You can style this itself, or place an icon inside.

```jsx
<RadioGroup.Root>
  <RadioGroup.Item>
    <RadioGroup.Indicator />
  </RadioGroup.Item>
</RadioGroup.Root>
```

## Identifying items

The `value` prop is required on `RadioGroup.Item` to identify it in the group.

```jsx
<RadioGroup.Root>
  <RadioGroup.Item value="a">
    <RadioGroup.Indicator />
  </RadioGroup.Item>
  <RadioGroup.Item value="b">
    <RadioGroup.Indicator />
  </RadioGroup.Item>
</RadioGroup.Root>
```

## Default value

The `defaultValue` prop determines the initial value of the component when uncontrolled, linked to the `value` prop on the items.

```jsx
<RadioGroup.Root defaultValue="a">
  <RadioGroup.Item value="a" />
  <RadioGroup.Item value="b" />
</RadioGroup.Root>
```

## Controlled

The `value` and `onValueChange` props contain the `value` string of the currently selected item in the radio group.

```jsx
const [value, setValue] = React.useState('a');

return (
  <RadioGroup.Root value={value} onValueChange={setValue}>
    <RadioGroup.Item value="a" />
    <RadioGroup.Item value="b" />
  </RadioGroup.Root>
);
```
