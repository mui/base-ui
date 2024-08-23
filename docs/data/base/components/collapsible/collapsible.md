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

- `<Collapsible.Root />` is a top-level component that facilitates communication between other components. It does not render to the DOM by default.
- `<Collapsible.Trigger />` is the trigger element, a `<button>` by default, that toggles the open/closed state of the content
- `<Collapsible.Content />` is component that contains the Collapsible's content

```js
<Collapsible.Root>
  <Collapsible.Trigger>Toggle</Collapsible.Trigger>
  <Collapsible.Content>This is the content</Collapsible.Content>
</Collapsible.Root>
```

## Improving searchability of hidden content

:::warning
This is [not yet supported](https://caniuse.com/mdn-html_global_attributes_hidden_until-found_value) in Safari and Firefox as of August 2024 and will fall back to the default `hidden` behavior.

:::

Content hidden in the `Collapsible.Content` component can be made accessible only to a browser's find-in-page functionality with the `htmlHidden` prop to improve searchability:

```js
<Collapsible.Root defaultOpen={false}>
  <Collapsible.Trigger>Toggle</Collapsible.Trigger>
  <Collapsible.Content htmlHidden="until-found">
    When this component is closed, this sentence will only be accessible to the
    browser's native find-in-page functionality
  </Collapsible.Content>
</Collapsible.Root>
```

We recommend using [CSS animations](#css-animations) for animated collapsibles that use this feature. Currently there is browser bug that does not highlight the found text inside elements that have a [CSS transition](#css-transitions) applied.

This relies on the HTML `hidden="until-found"` attribute which only has [partial browser support](https://caniuse.com/mdn-html_global_attributes_hidden_until-found_value) as of August 2024, but automatically falls back to the default `hidden` state in unsupported browsers.

## Animations

### Animation states

Four states are available as data attributes to animate the Collapsible:

- `[data-state="open"]` - `open` state is `true`.
- `[data-state="closed"]` - `open` state is `false`. Can still be mounted to the DOM if closing.
- `[data-entering]` - the `hidden` attribute was just removed from the DOM and the content element participates in page layout. The `data-entering` attribute will be removed 1 animation frame later.
- `[data-exiting]` - the content element is in the process of being hidden from the DOM, but is still mounted.

The component can be animate when opening or closing using either:

- CSS animations
- CSS transitions
- JavaScript animations

The height of the `Content` subcomponent is provided as the `--collapsible-content-height` CSS variable

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

When using CSS transitions, styles for the `Content` subcomponent must be applied to three states:

- The closed styles with `[data-state="closed"]`
- The open styles with `[data-state="open"]`
- The entering styles with `[data-entering]`

```css
.Collapsible-content {
  overflow: hidden;
}

.Collapsible2-content[data-state='open'] {
  height: var(--collapsible-content-height);
  transition: height 300ms ease-out;
}

.Collapsible-content[data-entering] {
  height: 0;
}

.Collapsible2-content[data-state='closed'] {
  height: 0;
  transition: height 300ms ease-in;
}
```

{{"demo": "CssTransitionCollapsible.js"}}

### JavaScript Animations

When using external libraries for animation, for example `framer-motion`, be aware that Collapsible hides content using the html `hidden` attribute in the closed state, and does not unmount the `Collapsible.Content` subcomponent.

```js
function App() {
  const [open, setOpen] = useState(false);
  return (
    <Collapsible.Root open={open} onOpenChange={setOpen}>
      <Collapsible.Trigger>Toggle</Collapsible.Trigger>
      <Collapsible.Content
        render={
          <motion.div
            key="CollapsibleContent"
            initial={false}
            animate={open ? 'open' : 'closed'}
            exit={!open ? 'open' : 'closed'}
            variants={{
              open: {
                height: 'auto',
                transition: { duration: 0.6, ease: 'ease-out' },
              },
              closed: {
                height: 0,
                transition: { duration: 0.6, ease: 'ease-in' },
                transitionEnd: { display: 'revert-layer' },
              },
            }}
          />
        }
      >
        This is the content
      </Collapsible.Content>
    </Collapsible.Root>
  );
}
```

## Overriding default components

Use the `render` prop to override the rendered elements with your own components. The `Collapsible.Root` component does not render an element to the DOM by default, but can do so with the render prop:

```jsx
// Element shorthand
<Collapsible.Root render={<MyCollapsibleRoot />} />
```

```jsx
// Function
<Collapsible.Root render={(props) => <MyCollapsibleRoot {...props} />} />
```
