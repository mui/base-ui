---
productId: base-ui
title: React Collapsible components
components: CollapsibleRoot, CollapsibleTrigger, CollapsibleContent
hooks: useCollapsibleRoot, useCollapsibleTrigger, useCollapsibleContent
githubLabel: 'component: collapsible'
waiAria: https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/
packageName: '@base_ui/react'
---

# Collapsible

<p class="description">Collapsible is a component that shows or hides content.</p>

{{"component": "@mui/docs/ComponentLinkHeader", "design": false}}

{{"component": "modules/components/ComponentPageTabs.js"}}

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
import * as Collapsible from '@base_ui/react/Collapsible';
```

## Anatomy

- `<Collapsible.Root />` is a top-level component that facilitates communication between other components. It does not render to the DOM.
- `<Collapsible.Trigger />` is the trigger element, a `<button>` by default, that toggles the open/closed state of the content
- `<Collapsible.Content />` is component that contains the Collapsible's content

```tsx
<Collapsible.Root>
  <Collapsible.Trigger>Toggle</Collapsible.Trigger>
  <Collapsible.Content>This is the content</Collapsible.Content>
</Collapsible.Root>
```
