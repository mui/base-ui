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

{{"demo": "UnstyledCollapsibleIntroduction.js", "defaultCodeOpen": false, "bg": "gradient"}}

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

## Animations

The Collapsible component can animate when opening or closing using either:

- CSS animations
- CSS transitions
- JavaScript animations

The height of the `Content` is provided as the `--collapsible-content-height` CSS variable

### CSS Animations

CSS animations can be used with two declarations:

```css
.Collapsible-content {
  overflow: hidden;
}

.Collapsible-content[data-state='open'] {
  animation: slideDown 300ms ease-out;
}

.Collapsible-content[data-state='closed'] {
  animation: slideUp 300ms ease-in;
}

@keyframes slideDown {
  from {
    height: 0;
  }
  to {
    height: var(--collapsible-content-height);
  }
}

@keyframes slideUp {
  from {
    height: var(--collapsible-content-height);
  }
  to {
    height: 0;
  }
}
```

{{"demo": "CssAnimatedCollapsible.js"}}

### CSS Transitions

```css
.Collapsible-content {
  overflow: hidden;
}

.Collapsible-content[data-entering] {
  height: 0;
}

.Collapsible2-content[data-state='open'] {
  height: var(--collapsible-content-height);
  transition: height 300ms ease-out;
}

.Collapsible2-content[data-state='closed'] {
  height: 0;
  transition: height 300ms ease-in;
}
```
