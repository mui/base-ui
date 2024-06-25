---
productId: base-ui
title: React Popover Component
components: PopoverRoot, PopoverTrigger, PopoverPositioner, PopoverPopup, PopoverArrow, PopoverBackdrop, PopoverTitle, PopoverDescription, PopoverClose
githubLabel: 'component: popover'
---

# Popover

<p class="description">Popovers are interactive floating elements that display rich content, anchored to a trigger element when a user clicks or optionally hovers over it.</p>

{{"component": "@mui/docs/ComponentLinkHeader", "design": false}}

{{"component": "modules/components/ComponentPageTabs.js"}}

## Introduction

Popovers can contain arbitrary rich interactive content similar to a Dialog. The main difference is that a Popover can be anchored to another element on the page and is non-modal by default, without a backdrop or required close button.

{{"demo": "UnstyledPopoverIntroduction", "defaultCodeOpen": false, "bg": "gradient"}}

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
import * as Popover from '@base_ui/react/Popover';
```

## Anatomy

Popover is implemented using a collection of related components:

- `<Popover.Root />` is a top-level component that wraps the other components.
- `<Popover.Trigger />` renders the trigger element.
- `<Popover.Backdrop />` renders an optional backdrop element behind the popup.
- `<Popover.Positioner />` renders the popover's positioning element.
- `<Popover.Popup />` renders the popover popup itself.
- `<Popover.Arrow />` renders an optional pointing arrow, placed inside the popup.
- `<Popover.Title />` renders an optional title heading element, placed inside the popup.
- `<Popover.Description />` renders an optional description element, placed inside the popup.
- `<Popover.Close />` renders an optional close button, placed inside the popup.

```tsx
<Popover.Root>
  <Popover.Trigger />
  <Popover.Backdrop />
  <Popover.Positioner>
    <Popover.Popup>
      <Popover.Arrow />
      <Popover.Title />
      <Popover.Description />
      <Popover.Close />
    </Popover.Popup>
  </Popover.Positioner>
</Popover.Root>
```

## Placement

By default, the popover is placed on the bottom side of its trigger, the default anchor. To change this, use the `side` prop:

```jsx
<Popover.Root>
  <Popover.Trigger />
  <Popover.Positioner side="right">
    <Popover.Popup>Popover</Popover.Popup>
  </Popover.Positioner>
</Popover.Root>
```

You can also change the alignment of the popover in relation to its anchor. By default, it is centered, but it can be aligned to an edge of the anchor using the `alignment` prop:

```jsx
<Popover.Positioner side="right" alignment="start">
  <Popover.Popup>Popover</Popover.Popup>
</Popover.Positioner>
```

Due to collision detection, the popover may change its placement to avoid overflow. Therefore, your explicitly specified `side` and `alignment` props act as "ideal", or preferred, values.

To access the true rendered values, which may change as the result of a collision, the popup element receives data attributes:

```jsx
// Rendered HTML (simplified)
<div>
  <div data-side="left" data-alignment="end">
    Popover
  </div>
</div>
```

This allows you to conditionally style the popover based on its rendered side or alignment.

## Offset

The `sideOffset` prop creates a gap between the anchor and popover popup, while `alignmentOffset` slides the popover popup from its alignment, acting logically for `start` and `end` alignments.

```jsx
<Popover.Positioner sideOffset={10} alignmentOffset={10}>
```

## Hover

To open the popover on hover instead of click for pointer users, which enables creating tooltip-like popovers that may contain interactive content, add the `openOnHover` prop:

```jsx
<Popover.Root openOnHover>
```

### Delay

To change how long the popover waits until it opens or closes when `openOnHover` is enabled, use the `delay` and `closeDelay` props, which represent how long the popover waits after the cursor rests on the trigger to open, or moves away from the trigger to close, in milliseconds:

```jsx
<Popover.Root openOnHover delay={200} closeDelay={200}>
```

The delay type can be changed from `"rest"` (user's cursor is static over the trigger for the given timeout in milliseconds) to `"hover"` (the user's cursor has entered the trigger):

```jsx
<Popover.Root openOnHover delayType="hover">
```

## Controlled

To control the popover with external state, use the `open` and `onOpenChange` props:

```jsx
function App() {
  const [open, setOpen] = React.useState(false);
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      {/* Subcomponents */}
    </Popover.Root>
  );
}
```

## Arrow

To add an arrow (caret or triangle) inside the popover content that points toward the center of the anchor element, use the `Popover.Arrow` component:

```jsx
<Popover.Positioner>
  <Popover.Popup>
    <Popover.Arrow />
    Popover
  </Popover.Popup>
</Popover.Positioner>
```

It automatically positions a wrapper element that can be styled or contain a custom SVG shape.

## Close

Since popovers are non-modal, a close button is not required — users can escape the popover at any time. However, a close button may still be rendered inside the popup to give additional ability to close the popover:

```jsx
<Popover.Popup>
  <Popover.Close />
</Popover.Popup>
```

## Title and description

To optionally label and describe the popover with wide screen reader support, use the `Title` and `Description` components:

```jsx
<Popover.Popup>
  <Popover.Title>My popover</Popover.Title>
  <Popover.Description>A description for my popover.</Popover.Description>
</Popover.Popup>
```

## Backdrop

You may dim content behind the popover in order to draw more attention to it by rendering an optional backdrop. This blocks pointer events behind the popover by default as well, meaning two clicks are required to click items behind the popover, as the first click triggers the popover to be dismissed.

```jsx
<Popover.Root>
  <Popover.Backdrop />
  {/* Subcomponents */}
</Popover.Root>
```

It has the same maximum `z-index` as the `Positioner` component by default, and should be placed before it in the React tree. This allows it to block all content behind it, and also be independently animated.

### Hover

When combining `openOnHover` with the Backdrop component, ensure the Backdrop does not block pointer events:

```jsx
<Popover.Backdrop style={{ pointerEvents: 'none' }} />
```

This will prevent the Popup from closing unexpectedly.

If the Backdrop is colored, then you may want to ensure the trigger element can appear over the top of it, so it acts more like a mask. To do so, ensure their z-index layering is correct:

```jsx
<Popover.Trigger style={{ position: 'relative', zIndex: 2 ** 31 - 1 }} />
<Popover.Backdrop style={{ zIndex: 2 ** 31 - 2 }} />
```

:::info
`2 ** 31 - 1` is the maximum possible `z-index`, ensuring the popover appears on the very top layer of the document.
:::

## Anchoring

By default, the `Trigger` acts as the anchor, but this can be changed to another element.

- A DOM element (stored in React state):

```jsx
<Popover.Positioner anchor={anchorNode}>
```

- A React ref:

```jsx
<Popover.Positioner anchor={anchorRef}>
```

- A virtual element object, consisting of a `getBoundingClientRect` method and an optional `contextElement` property:

```jsx
<Popover.Positioner
  anchor={{
    getBoundingClientRect: () => DOMRect,
    // `contextElement` is an optional but recommended property when `getBoundingClientRect` is
    // derived from a real element, to ensure collision detection and position updates work as
    // expected in certain DOM trees.
    contextElement: domNode,
  }}
>
```

## Styling

The `Popover.Positioner` element receives the following CSS variables, which can be used by `Popover.Popup`:

- `--anchor-width`: Specifies the width of the anchor element. You can use this to match the width of the popover with its anchor.
- `--anchor-height`: Specifies the height of the anchor element. You can use this to match the height of the popover with its anchor.
- `--available-width`: Specifies the available width of the popup before it overflows the viewport.
- `--available-height`: Specifies the available height of the popup before it overflows the viewport.
- `--transform-origin`: Specifies the origin of the popup element that represents the point of the anchor element's center. When animating scale, this allows it to correctly emanate from the center of the anchor.

### Large content

If your popover is large enough that it cannot fit inside the viewport (especially on small or narrow screens as on mobile devices), the `--available-width` and `--available-height` properties are useful to constrain its size to prevent it from overflowing.

```css
.PopoverPopup {
  max-width: var(--available-width);
  max-height: var(--available-height);
  overflow: auto;
}
```

The `overflow: auto` property will prevent the `Arrow` from appearing, if specified. You can instead place this on a wrapper child inside the `Popup`:

```jsx
<Popover.Popup className="PopoverPopup">
  <Popover.Arrow />
  <div className="PopoverPopup-content">Large content</div>
</Popover.Popup>
```

```css
.PopoverPopup-content {
  max-width: var(--available-width);
  max-height: var(--available-height);
  overflow: auto;
}
```

Absolute maximums can also be specified if the popover's size can be too large on wider or bigger screens:

```css
.PopoverPopup-content {
  max-width: min(500px, var(--available-width));
  max-height: min(500px, var(--available-height));
  overflow: auto;
}
```

## Animations

The popover can animate when opening or closing with either:

- CSS transitions
- CSS animations
- JavaScript animations

### CSS transitions

Here is an example of how to apply a symmetric scale and fade transition with the default conditionally-rendered behavior:

```jsx
<Popover.Popup className="PopoverPopup">Popover</Popover.Popup>
```

```css
.PopoverPopup {
  transform-origin: var(--transform-origin);
  transition-property: opacity, transform;
  transition-duration: 0.2s;
  /* Represents the final styles once exited */
  opacity: 0;
  transform: scale(0.9);
}

/* Represents the final styles once entered */
.PopoverPopup[data-state='open'] {
  opacity: 1;
  transform: scale(1);
}

/* Represents the initial styles when entering */
.PopoverPopup[data-entering] {
  opacity: 0;
  transform: scale(0.9);
}
```

Styles need to be applied in three states:

- The exiting styles, placed on the base element class
- The open styles, placed on the base element class with `[data-state="open"]`
- The entering styles, placed on the base element class with `[data-entering]`

{{"demo": "UnstyledPopoverTransition.js", "defaultCodeOpen": false}}

In newer browsers, there is a feature called `@starting-style` which allows transitions to occur on open for conditionally-mounted components:

```css
/* Base UI API - Polyfill */
.PopoverPopup[data-entering] {
  opacity: 0;
  transform: scale(0.9);
}

/* Official Browser API - no Firefox support as of May 2024 */
@starting-style {
  .PopoverPopup[data-state='open'] {
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

.PopoverPopup {
  animation: scale-in 0.2s forwards;
}

.PopoverPopup[data-exiting] {
  animation: scale-out 0.2s forwards;
}
```

### JavaScript animations

The `keepMounted` prop lets an external library control the mounting, for example `framer-motion`'s `AnimatePresence` component.

```js
function App() {
  const [open, setOpen] = useState(false);
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger>Trigger</Popover.Trigger>
      <AnimatePresence>
        {open && (
          <Popover.Positioner keepMounted>
            <Popover.Popup
              render={
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                />
              }
            >
              Popover
            </Popover.Popup>
          </Popover.Positioner>
        )}
      </AnimatePresence>
    </Popover.Root>
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

Animations can be removed under certain conditions using the `data-instant` attribute on `Popover.Popup`. This attribute can be used unconditionally, but it also has different values for granular checks:

- `data-instant="click"` indicates the popover was opened with keyboard or virtual click.
- `data-instant="dismiss"` indicates the popover was closed with the <kbd>esc</kbd> key or tabbed outside of.

In either case, you may want to remove animations:

```css
.PopoverPopup[data-instant] {
  transition-duration: 0s;
}
```

## Overriding default components

Use the `render` prop to override the rendered elements with your own components.

```jsx
// Element shorthand
<Popover.Popup render={<MyPopoverPopup />} />
```

```jsx
// Function
<Popover.Popup render={(props) => <MyPopoverPopup {...props} />} />
```
