---
productId: base-ui
title: React Tabs components
components: Tabs, Tab, TabPanel, TabsList, TabIndicator
hooks: useTab, useTabPanel, useTabs, useTabsList, useTabIndicator
githubLabel: 'component: tabs'
waiAria: https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
---

# Tabs

<p class="description">Tabs are UI elements for organizing and navigating between groups of related content.</p>

{{"component": "modules/components/ComponentLinkHeader.js", "design": false}}

{{"component": "modules/components/ComponentPageTabs.js"}}

## Introduction

Tabs are implemented using a collection of related components:

- `<Tabs />` - the top-level component that wraps the Tabs List and Tab Panel components so that tabs and their panels can communicate with one another.
- `<Tabs.Tab />` - the tab element itself. Clicking on a tab displays its corresponding panel.
- `<Tabs.List />` - the container that houses the tabs. Responsible for handling focus and keyboard navigation between tabs.
- `<Tabs.Panel />` - the card that hosts the content associated with a tab.
- `<Tabs.Indicator />` - an optional active tab indicator.

{{"demo": "UnstyledTabsIntroduction", "defaultCodeOpen": false, "bg": "gradient"}}

## Components

```jsx
import { Tabs } from '@base_ui/react/Tabs';
```

By default, Tab components and their corresponding panels are **zero-indexed** (that is the first tab has a `value` of `0`, then `1`, `2`, etc.).
Clicking on a given Tab opens the panel with the same `value`, which corresponds to the order in which each component is nested within its container.

Though not required, you can add the `value` prop to the Tab and Tab Panel to take control over how these components are associated with one another.

The following demo omits the `value` prop from the Tab components, and also defines `0` as the `defaultValue` for the Tabs component, which sets the first Tab and Panel as the defaults:

{{"demo": "UnstyledTabsBasic.js"}}

The next demo shows how to apply custom styles to a set of tabs:

{{"demo": "UnstyledTabsCustomized"}}

### Custom structure

Use the `render` prop to override the rendered element in any of the tab-related components:

```jsx
<Tabs.Tab render={(props) => <MyCustomTab {...props} />} />
```

If you provide a non-interactive element such as a `<span>`, the Tab components will automatically add the necessary accessibility attributes.

## Customization

### Vertical

Tab components can be arranged vertically as well as horizontally.

When vertical, you must set `orientation="vertical"` on the `<Tabs />` component so the user can navigate with the up and down arrow keys (rather than the default left-to-right behavior for horizontal tabs).

{{"demo": "UnstyledTabsVertical.js"}}

### Third-party routing library

A common use case for tabs is to implement client-side navigation that doesn't require an HTTP round-trip to the server.

{{"demo": "UnstyledTabsRouting.js"}}

## Keyboard navigation

By default, when using keyboard navigation, the Tab components open via **automatic activation**—that is, the next panel is displayed automatically when it's focused.

Alternatively, you can set the panels not to be displayed automatically when their corresponding tabs are in focus. This behavior is known as **manual activation**.

To enable manual activation, set the `activateOnFocus` prop to `false` on the `<Tabs.List />` component:

```jsx
/* Tabs where selection does not follow focus */
<Tabs.List activateOnFocus={false} />
```

The following demo pair illustrates the difference between manual and automatic activation.
Move the focus to a tab in either demo and navigate with the arrow keys to observe the difference:

{{"demo": "KeyboardNavigation.js"}}

## Accessibility

(WAI-ARIA: https://www.w3.org/WAI/ARIA/apg/patterns/tabs/)

To make the Tab component suite accessible to assistive technology, label the `<Tabs.List />` element with `aria-label` or `aria-labelledby`.

```jsx
<Tabs>
  <Tabs.List aria-label="Seasons">
    <Tabs.Tab>Spring</Tabs.Tab>
    <Tabs.Tab>Summer</Tabs.Tab>
    <Tabs.Tab>Fall</Tabs.Tab>
    <Tabs.Tab>Winter</Tabs.Tab>
  </Tabs.List>
</Tabs>
```
