---
productId: base-ui
title: React Select components and hook
components: SelectRoot, SelectTrigger, SelectValue, SelectIcon, SelectBackdrop, SelectPositioner, SelectPopup, SelectOption, SelectOptionIndicator, SelectOptionGroup, SelectOptionGroupLabel, SelectScrollUpArrow, SelectScrollDownArrow, SelectSeparator, SelectArrow
githubLabel: 'component: select'
waiAria: https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-select-only/
---

# Select

<p class="description">Select provides users with a floating element containing a list of options to choose from.</p>

{{"component": "@mui/docs/ComponentLinkHeader", "design": false}}

{{"component": "modules/components/ComponentPageTabs.js"}}

{{"demo": "SelectIntroduction", "defaultCodeOpen": false, "bg": "gradient"}}

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
import * as Select from '@base_ui/react/Select';
```

## Anatomy

Selects are implemented using a collection of related components:

- `<Select.Root />` is a top-level component that wraps the other components.
- `<Select.Trigger />` renders the trigger element that opens the select popup on click.
- `<Select.Value />` renders the value of the select.
- `<Select.Icon />` renders a caret icon.
- `<Select.Backdrop />` renders a backdrop element behind the popup.
- `<Select.Positioner />` renders the select popup's positioning element.
- `<Select.Popup />` renders the select popup itself.
- `<Select.Option />` renders an option, placed inside the popup.
- `<Select.OptionIndicator />` renders an option indicator inside an option to indicate it's selected (e.g. a check icon).
- `<Select.OptionGroup />` renders an option group, wrapping `<Select.Option>` components.
- `<Select.OptionGroupLabel />` renders a label for an option group.
- `<Select.ScrollUpArrow />` renders a scrolling arrow for the `alignMethod="item"` anchoring mode.
- `<Select.ScrollDownArrow />` renders a scrolling arrow for the `alignMethod="item"` anchoring mode.
- `<Select.Separator />` renders a separator between option groups.
- `<Select.Arrow />` renders the select popup's arrow when using `alignMethod="trigger"`.

```jsx
<Select.Root>
  <Select.Trigger>
    <Select.Value />
    <Select.Icon />
  </Select.Trigger>

  <Select.Backdrop />

  <Select.Positioner>
    <Select.ScrollUpArrow />

    <Select.Popup>
      <Select.OptionGroup>
        <Select.OptionGroupLabel />
        <Select.Option>
          <Select.OptionIndicator />
        </Select.Option>
      </Select.OptionGroup>
      <Select.Separator />
    </Select.Popup>

    <Select.Arrow />

    <Select.ScrollDownArrow />
  </Select.Positioner>
</Select.Root>
```

## Align method

Two different methods to align the popup are available:

- `alignMethod="item"` (default)
- `alignMethod="trigger"`

```jsx
<Select.Root alignMethod="trigger">
```

The `item` method aligns the popup such that the selected item inside of it appears centered over the trigger. If there's not enough space, it falls back to `trigger` anchoring.

The `trigger` method aligns the popup to the trigger itself on its top or bottom side, which is the standard form of anchor positioning used in Tooltip, Popover, Menu, etc.

## Value

The `Select.Value` subcomponent renders the selected value. This is the text content or `label` of `Select.Option` by default.

The `placeholder` prop can be used when the value is empty. During SSR, if a default value is specified as the selected option, the value isn't available until hydration:

```jsx
<Select.Trigger>
  <Select.Value placeholder="Select value..." />
</Select.Trigger>
```

A function can be specified as a child to customize the rendering of the value:

```jsx
<Select.Value>{(value) => <span>{value}</span>}</Select.Value>
```
