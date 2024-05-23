---
productId: base-ui
title: React Tooltip component
components: TooltipRoot, TooltipPopup, TooltipTrigger, TooltipGroup, TooltipArrow
hooks: useTooltipRoot, useTooltipPopup
githubLabel: 'component: tooltip'
waiAria: https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/
---

# Tooltip

<p class="description">Tooltips are visual-only floating elements that display information about a trigger element when a user hovers or focuses it.</p>

{{"component": "modules/components/ComponentLinkHeader.js", "design": false}}

{{"component": "modules/components/ComponentPageTabs.js"}}

## Introduction

{{"demo": "UnstyledTooltipIntroduction", "defaultCodeOpen": false, "bg": "gradient"}}

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
import * as Tooltip from '@base_ui/react/Tooltip';
```

:::info
If critical information is hidden behind a tooltip, you're likely looking for an infotip instead. These are created by using the `Popover` component and enabling the hover trigger. Infotips are floating elements that anchor themselves to an icon designed only to display information, not a button ("tool") that performs an action. All inputs, including touch, can see an infotip.
:::

## Anatomy

Tooltip is implemented using a collection of related components:

- `<Tooltip.Root />` is a top-level component that wraps all other components.
- `<Tooltip.Trigger />` renders the trigger element.
- `<Tooltip.Popup />` renders the tooltip popup itself.
- `<Tooltip.Arrow />` renders an optional pointing arrow, placed inside the popup.

```tsx
<Tooltip.Root>
  <Tooltip.Trigger />
  <Tooltip.Popup>
    <Tooltip.Arrow />
    Tooltip
  </Tooltip.Popup>
</Tooltip.Root>
```

## Accessibility

Tooltips are only for sighted users with access to a pointer with hover capability or keyboard focus. This means you must supply an accessible name via `aria-label` to trigger elements that don't contain text content, such as an icon button.

```jsx
<Tooltip.Root>
  <Tooltip.Trigger aria-label="Edit">
    <EditIcon />
  </Tooltip.Trigger>
  <Tooltip.Popup>Edit</Tooltip.Popup>
</Tooltip.Root>
```

Your `aria-label` and tooltip content should closely match or be identical so that screen reader users and sighted users receive the same information.

Tooltips should ideally also be secondary in nature, because touch users cannot see them. They are most useful as progressive enhancement in high-density desktop applications that have many icon buttons where visual labels are impractical to use. They are also useful for things like thumbnail tooltips when hovering over a progress bar when using a mouse.

## Placement

By default, the tooltip is placed on the top side of its anchor. To change this, use the `side` prop on `Tooltip.Popup`:

```jsx
<Tooltip.Root>
  <Tooltip.Trigger />
  <Tooltip.Popup side="right">Tooltip</Tooltip.Popup>
</Tooltip.Root>
```

You can also change the alignment of the tooltip in relation to its anchor. By default, it is centered, but it can be aligned to an edge of the anchor using the `alignment` prop:

```jsx
<Tooltip.Popup side="right" alignment="start">
  Tooltip
</Tooltip.Popup>
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
<Tooltip.Popup sideOffset={10}>
```

This creates a gap between the anchor and its tooltip content.

### Alignment

To offset the alignment position, use the `alignmentOffset` prop:

```jsx
<Tooltip.Popup alignmentOffset={10}>
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

To prevent the content inside from being hoverable, use the `hoverable` prop on `Tooltip.Root`:

```jsx
<Tooltip.Root hoverable={false}>
```

:::info
This has accessibility consequences and should only be disabled when necessary, such as in high-density UIs where tooltips can block other nearby controls.
:::

## Arrow

To add an arrow (caret or triangle) inside the tooltip content that points toward the center of the anchor element, use the `Tooltip.Arrow` component:

```js
<Tooltip.Popup>
  Tooltip
  <Tooltip.Arrow />
</Tooltip.Popup>
```

It automatically positions a wrapper element that can be styled or contain a custom SVG shape.

## Cursor following

The tooltip can follow the cursor on both axes or one axis using the `followCursorAxis` prop on `Tooltip.Popup`. Possible values are: `none` (default), `both`, `x`, or `y`.

{{"demo": "UnstyledTooltipFollowCursor.js"}}

## Anchoring

By default, the `Trigger` acts as the anchor. This can be changed to another element, either virtual or real:

```js
<Tooltip.Popup
  // Element
  anchor={domElement}
  // React ref
  anchor={anchorRef}
  // VirtualElement
  anchor={{
    getBoundingClientRect: () => DOMRect,
    contextElement: domElement, // optional
  }}
>
  Content
</Tooltip.Popup>
```

## Styling

The `Tooltip.Popup` element receives the following CSS variables:

- `--anchor-width`: Specifies the width of the anchor element. You can use this to match the width of the tooltip with its anchor.
- `--anchor-height`: Specifies the height of the anchor element. You can use this to match the height of the tooltip with its anchor.
- `--available-width`: Specifies the available width of the popup element before it overflows the viewport.
- `--available-height`: Specifies the available height of the popup element before it overflows the viewport.
- `--transform-origin`: Specifies the origin of the popup element that represents the point of the anchor element's center. When animating scale, this allows it to correctly emanate from the center of the anchor.

```jsx
<Tooltip.Popup
  style={{
    width: 'var(--anchor-width)',
    height: 'var(--anchor-height)',
  }}
>
  Content
</Tooltip.Popup>
```

By default, `maxWidth` and `maxHeight` are already specified using `--available-{width,height}` to prevent the tooltip from being too big to fit on the screen.

## Animations

The tooltip can animate when opening or closing with either:

- CSS transitions
- CSS animations
- JavaScript animations

### CSS transitions

Here is an example of how to apply a symmetric scale and fade transition with the default conditionally-rendered behavior:

```jsx
<Tooltip.Popup className="TooltipPopup">Tooltip</Tooltip.Popup>
```

```css
.TooltipPopup {
  transform-origin: var(--transform-origin);
  transition-property: opacity, transform;
  transition-duration: 0.2s;
  /* Represents the final styles once exited */
  opacity: 0;
  transform: scale(0.9);
}

/* Represents the final styles once entered */
.TooltipPopup[data-state='open'] {
  opacity: 1;
  transform: scale(1);
}

/* Represents the initial styles when entering */
.TooltipPopup[data-entering] {
  opacity: 0;
  transform: scale(0.9);
}
```

Styles need to be applied in three states:

- The exiting styles, placed on the base element class
- The open styles, placed on the base element class with `[data-state="open"]`
- The entering styles, placed on the base element class with `[data-entering]`

{{"demo": "UnstyledTooltipTransition.js", "defaultCodeOpen": false}}

In newer browsers, there is a feature called `@starting-style` which allows transitions to occur on open for conditionally-mounted components:

```css
/* Base UI API - Polyfill */
.TooltipPopup[data-entering] {
  opacity: 0;
  transform: scale(0.9);
}

/* Official Browser API - no Firefox support as of May 2024 */
@starting-style {
  .TooltipPopup[data-state='open'] {
    opacity: 0;
    transform: scale(0.9);
  }
}
```

### CSS animations

CSS animations can also be used, requiring only two separate declarations:

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

.TooltipPopup {
  animation: scale-in 0.2s forwards;
}

.TooltipPopup[data-exiting] {
  animation: scale-out 0.2s forwards;
}
```

### JavaScript animations

The `keepMounted` prop lets an external library control the mounting, for example `framer-motion`'s `AnimatePresence` component.

```js
function App() {
  const [open, setOpen] = useState(false);
  return (
    <Tooltip.Root open={open} onOpenChange={setOpen}>
      <Tooltip.Trigger>Trigger</Tooltip.Trigger>
      <AnimatePresence>
        {open && (
          <Tooltip.Popup keepMounted render={<motion.div /* motion props */ />}>
            Tooltip
          </Tooltip.Popup>
        )}
      </AnimatePresence>
    </Tooltip.Root>
  );
}
```

### Animation states

Four states are available as data attributes to animate the popup, which enables full control depending on whether the popup is being animated with CSS transitions or animations, JavaScript, or is using the `keepMounted` prop.

- `[data-state="open"]` - `open` state is `true`.
- `[data-state="closed"]` - `open` state is `false`. Can still be mounted to the DOM if closing.
- `[data-entering]` - the popup was just inserted to the DOM. The attribute is removed 1 animation frame later. Enables "starting styles" upon insertion for conditional rendering.
- `[data-exiting]` - the popup is in the process of being removed from the DOM, but is still mounted.

### Instant animation

Animations can be removed under certain conditions using the `data-instant` attribute on `Tooltip.Popup`. This attribute can be used unconditionally, but it also has different values for granular checks:

- `data-instant="delay"` indicates the tooltip is grouped and instantly opened with no delay.
- `data-instant="focus"` indicates it was triggered by keyboard focus.
- `data-instant="dismiss"` indicates it was dismissed by pressing the `esc` key.

In most of these cases, you'll want to remove any animations:

```css
.TooltipPopup[data-instant] {
  transition-duration: 0s;
}
```

## Overriding default components

Use the `render` prop to override the rendered elements with your own components.

```jsx
// Element shorthand
<Tooltip.Popup render={<MyTooltipPopup />} />
```

```jsx
// Function
<Tooltip.Popup render={(props) => <MyTooltipPopup {...props} />} />
```
