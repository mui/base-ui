---
productId: base-ui
title: React Tooltip component
components: TooltipRoot, TooltipContent, TooltipTrigger, TooltipGroup, TooltipArrow
hooks: useTooltip, useTooltipOpenState
githubLabel: 'component: tooltip'
waiAria: https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/
---

# Tooltip

<p class="description">Tooltips are floating elements that display information when a user hovers or focuses an element.</p>

{{"component": "modules/components/ComponentLinkHeader.js", "design": false}}

{{"component": "modules/components/ComponentPageTabs.js"}}

## Introduction

Tooltips are visual-only floating elements that display information about an element for sighted users when using a mouse to hover or keyboard to focus.

{{"demo": "UnstyledTooltipIntroduction", "defaultCodeOpen": false, "bg": "gradient"}}

## Installation

Base UI components are all available as a single package.

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
import * as Tooltip from '@base_ui/react/Tooltip';
```

:::info
If critical information is hidden behind a tooltip, you're likely looking for an infotip instead. These are created by using the `Popover` component and enabling the hover trigger. Infotips are floating elements that anchor themselves to an icon designed only to display information, not a button ("tool") that performs an action. All inputs, including touch, can see an infotip.
:::

## Anatomy

Tooltip is implemented using a collection of related components:

- `<Tooltip.Root />` is a top-level component that wraps all other components.
- `<Tooltip.Trigger />` contains the trigger element.
- `<Tooltip.Content />` contains the tooltip content.
- `<Tooltip.Arrow />` renders an optional pointing arrow.

```tsx
<Tooltip.Root>
  <Tooltip.Trigger>
    <button>My trigger</button>
  </Tooltip.Trigger>
  <Tooltip.Content>
    <Tooltip.Arrow />
    My tooltip
  </Tooltip.Content>
</Tooltip.Root>
```

## Accessibility

Tooltips are only for sighted users with access to a pointer with hover capability or keyboard focus. This means you must supply an accessible name via `aria-label` to elements that don't contain text content, such as an icon button.

```jsx
<Tooltip.Root>
  <Tooltip.Trigger>
    <button aria-label="Edit">
      <EditIcon />
    </button>
  </Tooltip.Trigger>
  <Tooltip.Content>Edit</Tooltip.Content>
</Tooltip.Root>
```

Your `aria-label` and tooltip content should closely match or be identical so that screen reader users and sighted users receive the same information.

Tooltips should ideally also be secondary in nature, because touch users cannot see them. They are most useful as progressive enhancement in high-density desktop applications that have many icon buttons where visual labels are impractical to use. They are also useful for things like thumbnail tooltips when hovering over a progress bar when using a mouse.

## Placement

By default, the tooltip is placed on the top side of its anchor. To change this, use the `side` prop on `Tooltip.Content`:

```jsx
<Tooltip.Root>
  <Tooltip.Trigger>
    <button>Trigger</button>
  </Tooltip.Trigger>
  <Tooltip.Content side="right">Tooltip</Tooltip.Content>
</Tooltip.Root>
```

You can also change the alignment of the tooltip in relation to its anchor. By default, it is centered, but it can be aligned to an edge of the anchor using the `alignment` prop:

```jsx
<Tooltip.Content side="right" alignment="start">
  Tooltip
</Tooltip.Content>
```

Possible alignment values are `center`, `start`, and `end`. The latter two are logical values that adapt to the writing direction (LTR or RTL).

Due to collision detection, the tooltip may change its placement to avoid overflow. Therefore, your explicitly specified `side` and `alignment` props act as "ideal", or preferred, values.

To access the true rendered values, which may change as the result of a collision, the content element receives data attributes:

```jsx
// Rendered HTML
<div data-side="left" data-alignment="end">
  Content
</div>
```

This allows you to conditionally style the tooltip based on its rendered side or alignment.

## Offsets

### Side

To offset the side position, use the `sideOffset` prop:

```jsx
<Tooltip.Content sideOffset={10}>
```

This creates a gap between the anchor and its tooltip content.

### Alignment

To offset the alignment position, use the `alignmentOffset` prop:

```jsx
<Tooltip.Content alignmentOffset={10}>
```

This prop acts logically for the `start` and `end` alignments.

## Delay

By default, the tooltip waits until the user's cursor is at rest over the anchor element before it is opened. To change this timeout, use the `delay` prop, which represents how long the tooltip waits after the cursor rests to open in milliseconds:

```jsx
<Tooltip.Root delay={200}>
```

The close delay can also be configured:

```jsx
<Tooltip.Root closeDelay={200}>
```

The delay type can be changed from `"rest"` (user's cursor is static for the given timeout in milliseconds) to `"hover"`:

```jsx
<Tooltip.Root delayType="hover">
```

## Grouping

To ensure nearby trigger elements' delays become `0` once one of the tooltips of the group opens, use the `Tooltip.Group` component, wrapping the `Tooltip.Root`s with it.

{{"demo": "UnstyledTooltipDelayGroup.js"}}

## Controlled

To control the tooltip with external state, use the `open` and `onOpenChange` props:

```jsx
function App() {
  const [open, setOpen] = React.useState(false);
  return (
    <Tooltip.Root open={open} onOpenChange={setOpen}>
      {/* Subcomponents */}
    </Tooltip.Root>
  );
}
```

## Default open

To show the tooltip initially while leaving it uncontrolled, use the `defaultOpen` prop:

```jsx
<Tooltip.Root defaultOpen>
```

## Hoverable content

To prevent the content inside from being hoverable, use the `hoverable` prop:

```jsx
<Tooltip.Content hoverable={false}>
```

:::info
This has accessibility consequences and should only be disabled when necessary, such as in high-density UIs where tooltips can block other nearby controls.
:::

## Arrow

To add an arrow (caret or triangle) inside the tooltip content that points toward the center of the anchor element, use the `Tooltip.Arrow` component:

```js
<Tooltip.Content>
  Tooltip
  <Tooltip.Arrow width={10} height={5} tipRadius={1} />
</Tooltip.Content>
```

Its `width`, `height`, `fill`, `stroke`, `strokeWidth`, `tipRadius` (tip rounding), and `d` (custom path) prop can be specified.

For example, you can use a fancily rounded arrow like so:

```jsx
<Tooltip.Content>
  Tooltip
  <Tooltip.Arrow
    width={20}
    height={20}
    d="M0 20C0 20 2.06906 19.9829 5.91817 15.4092C7.49986 13.5236 8.97939 12.3809 10.0002 12.3809C11.0202 12.3809 12.481 13.6451 14.0814 15.5472C17.952 20.1437 20 20 20 20H0Z"
  />
</Tooltip.Content>
```

## Cursor following

The tooltip can follow the cursor on both axes or one axis using the `followCursorAxis` prop on `Tooltip.Content`. Possible values are: `none` (default), `both`, `x`, or `y`.

{{"demo": "UnstyledTooltipFollowCursor.js"}}

## Anchoring

By default, the `Trigger` acts as the anchor. This can be changed to another element, either virtual or real:

```js
<Tooltip.Content
  // Element
  anchor={domElement}
  // React ref
  anchor={anchorRef}
  // VirtualElement
  anchor={{ getBoundingClientRect: () => DOMRect }}
>
  <button />
</Tooltip.Content>
```

## Styling

The `Tooltip.Content` element receives the following CSS variables:

- `--anchor-width`: Specifies the width of the anchor element. You can use this to match the width of the tooltip with its anchor.
- `--anchor-height`: Specifies the height of the anchor element. You can use this to match the height of the tooltip with its anchor.
- `--available-width`: Specifies the available width of the tooltip element before it overflows the viewport.
- `--available-height`: Specifies the available height of the tooltip element before it overflows the viewport.
- `--transform-origin`: Specifies the origin of the floating element that represents the point of the anchor element's center. When animating scale, this allows it to correctly emanate from the center of the anchor.

```jsx
<Tooltip.Content
  style={{
    width: 'var(--anchor-width)',
    height: 'var(--anchor-height)',
  }}
>
  Content
</Tooltip.Content>
```

By default, `maxWidth` and `maxHeight` are already specified using `--available-{width,height}` to prevent the tooltip from being too big to fit on the screen.

## Animations

CSS transitions or animations can be used to animate the tooltip opening or closing.

`Tooltip.Content` receives a `data-status` attribute in one of four states:

- `unmounted`, indicating the tooltip is not mounted on the DOM.
- `initial`, indicating the tooltip has been inserted into the DOM.
- `opening`, indicating the tooltip is transitioning into the open state, immediately after insertion.
- `closing`, indicating the tooltip is transitioning into the closed state.

Here is an example of how to apply a symmetric scale and fade transition:

```jsx
<Tooltip.Content className="TooltipContent">Tooltip</Tooltip.Content>
```

```css
.TooltipContent {
  transition-property: opacity, transform;
  transition-duration: 0.2s;
  opacity: 0;
  transform: scale(0.9);
  transform-origin: var(--transform-origin);
}

.TooltipContent[data-status='opening'] {
  opacity: 1;
  transform: scale(1);
}
```

{{"demo": "UnstyledTooltipTransition.js", "defaultCodeOpen": false}}

CSS animations can also be used—useful for more complex animations with differing property durations:

```css
@keyframes scale-in {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
}

@keyframes scale-out {
  to {
    opacity: 0;
    transform: scale(0.9);
  }
}

.TooltipContent {
  animation: scale-in 0.2s;
}

.TooltipContent[data-status='closing'] {
  animation: scale-out 0.2s forwards;
}
```

### Instant animation

Animations can be removed under certain conditions using the `data-instant` attribute on `Tooltip.Content`. This attribute can be used unconditionally, but it also has different values for granular checks:

- `data-instant="delay"` indicates the tooltip is grouped and instantly opened with no delay.
- `data-instant="focus"` indicates it was triggered by keyboard focus.
- `data-instant="dismiss"` indicates it was dismissed by pressing the `esc` key.

In most of these cases, you'll want to remove any animations:

```css
.TooltipContent[data-instant] {
  transition-duration: 0s;
}
```

## Overriding default components

Use the `render` prop to override the rendered elements with your own components.

```jsx
// Element shorthand
<Tooltip.Content render={<MyTooltipContent />} />
```

```jsx
// Function
<Tooltip.Content render={(props) => <MyTooltipContent {...props} />} />
```
