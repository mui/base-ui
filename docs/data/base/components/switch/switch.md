---
productId: base-ui
title: React Switch component and hook
components: SwitchRoot, SwitchThumb
hooks: useSwitch
githubLabel: 'component: switch'
waiAria: https://www.w3.org/WAI/ARIA/apg/patterns/switch/
---

# Switch

<p class="description">Switches are UI elements that let users choose between two states—most commonly on/off.</p>

{{"component": "modules/components/ComponentLinkHeader.js", "design": false}}

{{"component": "modules/components/ComponentPageTabs.js"}}

## Introduction

The Switch component provides users with a switch for toggling between two mutually exclusive states.

{{"demo": "UnstyledSwitchIntroduction", "defaultCodeOpen": false, "bg": "gradient"}}

## Component

```jsx
import * as Switch from '@base_ui/react/Switch';
```

### Anatomy

The Switch component is composed of a root that houses one interior slot—a thumb:

```tsx
<Switch.Root>
  <Switch.Thumb />
</Switch.Root>
```

### Custom structure

Use the `render` prop to override the root or thumb component:

```jsx
<Switch.Root render={(props) => <MyFancySwitchRoot {...props} />}>
  <Switch.Thumb render={(props) => <MyFancySwitchThumb {...props} />} />
</Switch.Root>
```

## Hook

```js
import { useSwitch } from '@base_ui/react/useSwitch';
```

The `useSwitch` hook lets you apply the functionality of a Switch to a fully custom component.
It returns props to be placed on the custom component, along with fields representing the component's internal state.

:::info
Hooks give you the most room for customization, but require more work to implement.
With hooks, you can take full control over how your component is rendered, and define all the custom props and CSS classes you need.

You may not need to use hooks unless you find that you're limited by the customization options of their component counterparts—for instance, if your component requires significantly different [HTML structure](#anatomy).
:::

## Accessibility

To make the Switch component accessible, you should ensure that the corresponding labels reflect the Switch's current state.
