---
productId: base-ui
title: React Radio Group component
components: RadioGroupRoot, RadioRoot, RadioIndicator
githubLabel: 'component: radio'
waiAria: https://www.w3.org/WAI/ARIA/apg/patterns/radio/
---

# Radio Group

<p class="description">Radio Groups contain a set of checkable buttons where only one of the buttons can be checked at a time.</p>

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

Once you have the package installed, import the components.

```ts
import * as RadioGroup from '@base_ui/react/RadioGroup';
import * as Radio from '@base_ui/react/Radio';
```

## Anatomy

Radio Group is composed of a `Root` and `Radio` components:

- `<RadioGroup.Root />` is a top-level element that wraps the other components.
- `<Radio.Root />` renders an individual `<button>` radio item.
- `<Radio.Indicator />` renders a `<span>` for providing a visual indicator. You can style this itself and/or place an icon inside.

```jsx
<RadioGroup.Root>
  <Radio.Root>
    <Radio.Indicator />
  </Radio.Root>
</RadioGroup.Root>
```

## Identifying items

The `value` prop is required on `Radio.Root` to identify it in the Radio Group:

```jsx
<RadioGroup.Root>
  <Radio.Root value="a">
    <Radio.Indicator />
  </Radio.Root>
  <Radio.Root value="b">
    <Radio.Indicator />
  </Radio.Root>
</RadioGroup.Root>
```

## Default value

The `defaultValue` prop determines the initial value of the component when uncontrolled, linked to the `value` prop on an individual Radio item:

```jsx
<RadioGroup.Root defaultValue="a">
  <Radio.Root value="a" />
  <Radio.Root value="b" />
</RadioGroup.Root>
```

## Controlled

The `value` and `onValueChange` props contain the `value` string of the currently selected Radio item in the Radio Group:

```jsx
const [value, setValue] = React.useState('a');

return (
  <RadioGroup.Root value={value} onValueChange={setValue}>
    <Radio.Root value="a" />
    <Radio.Root value="b" />
  </RadioGroup.Root>
);
```

## Styling

The `Radio` components have a `[data-radio]` attribute with values `"checked"` or `"unchecked"` to style based on the checked state:

```jsx
<Radio.Root className="Radio">
  <Radio.Indicator className="RadioIndicator" />
</Radio.Root>
```

```css
.Radio {
  border: 1px solid black;
}

.RadioIndicator {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 1px solid black;
}

.Radio[data-radio='checked'] {
  background: black;
  color: white;
}

.RadioIndicator[data-radio='checked'] {
  background: white;
}
```
