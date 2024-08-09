---
productId: base-ui
title: React Switch component
components: SwitchRoot, SwitchThumb
hooks: useSwitchRoot
githubLabel: 'component: switch'
waiAria: https://www.w3.org/WAI/ARIA/apg/patterns/switch/
packageName: '@base_ui/react'
---

# Switch

<p class="description">Switch is a UI element that let users choose between two states.</p>

{{"component": "@mui/docs/ComponentLinkHeader", "design": false}}

{{"component": "modules/components/ComponentPageTabs.js"}}

{{"demo": "UnstyledSwitchIntroduction", "defaultCodeOpen": false, "bg": "gradient"}}

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
import * as Switch from '@base_ui/react/Switch';
```

## Anatomy

Switch is composed of two components:

- `<Switch.Root />` renders a `<button>`.
- `<Switch.Thumb />` renders a `<span>` for providing a visual indicator.

```tsx
<Switch.Root>
  <Switch.Thumb />
</Switch.Root>
```

## Overriding default components

Use the `render` prop to override the root or thumb component:

```jsx
<Switch.Root render={(props) => <MyCustomSwitch {...props} />}>
  <Switch.Thumb render={(props) => <MyCustomThumb {...props} />} />
</Switch.Root>
```

## Accessibility

Ensure the Switch has an accessible name via a `<label>` element.

```jsx
<Switch.Root id="my-switch">
  <Switch.Thumb />
</Switch.Root>
<label htmlFor="my-switch">
  My label
</label>
```
