---
productId: base-ui
title: React Select components and hook
components: SelectRoot, SelectTrigger, SelectBackdrop, SelectPositioner, SelectPopup, SelectOption, SelectOptionIndicator, SelectOptionGroup, SelectOptionGroupLabel, SelectValue, SelectScrollArrow, SelectSeparator
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
- `<Select.Backdrop />` renders a backdrop element behind the popup.
- `<Select.Positioner />` renders the select popup's positioning element.
- `<Select.Popup />` renders the select popup itself.
- `<Select.Option />` renders an option, placed inside the popup.
- `<Select.OptionIndicator />` renders an option indicator inside an option to indicate it's selected (e.g. a check icon).
- `<Select.OptionGroup />` renders an option group, wrapping `<Select.Option>` components.
- `<Select.OptionGroupLabel />` renders a label for an option group.
- `<Select.ScrollArrow />` renders a scrolling arrow for the `alignToItem` (default) anchoring mode.

```jsx
<Select.Root>
  <Select.Trigger>
    <Select.Value />
  </Select.Trigger>

  <Select.Backdrop />

  <Select.Positioner>
    <Select.ScrollArrow direction="up" />

    <Select.Popup>
      <Select.OptionGroup>
        <Select.OptionGroupLabel />
        <Select.Option>
          <Select.OptionIndicator />
        </Select.Option>
      </Select.OptionGroup>
      <Select.Separator />
    </Select.Popup>

    <Select.ScrollArrow direction="down" />
  </Select.Positioner>
</Select.Root>
```
