---
productId: base-ui
title: React Hover Card Component
components: HoverCardRoot, HoverCardTrigger, HoverCardPositioner, HoverCardPopup, HoverCardArrow, HoverCardBackdrop
githubLabel: 'component: hover-card'
---

# Hover Card

<p class="description">Hover Cards are visual-only interactive floating elements that display a concise preview of a link's contents when a user hovers over it before navigating through.</p>

{{"component": "@mui/docs/ComponentLinkHeader", "design": false}}

{{"component": "modules/components/ComponentPageTabs.js"}}

## Introduction

{{"demo": "UnstyledHoverCardIntroduction", "defaultCodeOpen": false, "bg": "gradient"}}

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
import * as HoverCard from '@base_ui/react/HoverCard';
```

## Anatomy

Hover Card is implemented using a collection of related components:

- `<HoverCard.Root />` is a top-level component that wraps the other components.
- `<HoverCard.Trigger />` renders the trigger element.
- `<HoverCard.Backdrop />` renders an optional backdrop element behind the popup.
- `<HoverCard.Positioner />` renders the Hover Card's positioning element.
- `<HoverCard.Popup />` renders the Hover Card popup itself.
- `<HoverCard.Arrow />` renders an optional pointing arrow, placed inside the popup.

```tsx
<HoverCard.Root>
  <HoverCard.Trigger />
  <HoverCard.Backdrop />
  <HoverCard.Positioner>
    <HoverCard.Popup>
      <HoverCard.Arrow />
    </HoverCard.Popup>
  </HoverCard.Positioner>
</HoverCard.Root>
```

## Accessibility

Hover Cards cannot be accessed by a modality other than a pointer with hover capability, usually a mouse. They are a type of progressive enhancement component to display a concise preview of a link before a sighted user decides to commit to navigating to the link's new location.

Guidelines:

- Hover Cards should not contain content that cannot be viewed when navigating through to the link's new location — ensure they act as a preview of the _same_ information contained in the link.
- Hover Cards should avoid form inputs other than buttons, as the Hover Card will close when the cursor leaves its boundaries, making it difficult to preserve state or fill out information.

## Placement

By default, the Hover Card is placed on the bottom side of its trigger, the default anchor. To change this, use the `side` prop:

```jsx
<HoverCard.Root>
  <HoverCard.Trigger />
  <HoverCard.Positioner side="right">
    <HoverCard.Popup>Hover Card</HoverCard.Popup>
  </HoverCard.Positioner>
</HoverCard.Root>
```

You can also change the alignment of the Hover Card in relation to its anchor. By default, it is centered, but it can be aligned to an edge of the anchor using the `alignment` prop:

```jsx
<HoverCard.Positioner side="right" alignment="start">
  <HoverCard.Popup>Hover Card</HoverCard.Popup>
</HoverCard.Positioner>
```

Due to collision detection, the Hover Card may change its placement to avoid overflow. Therefore, your explicitly specified `side` and `alignment` props act as "ideal", or preferred, values.

To access the true rendered values, which may change as the result of a collision, the popup element receives data attributes:

```jsx
// Rendered HTML (simplified)
<div>
  <div data-side="left" data-alignment="end">
    Hover Card
  </div>
</div>
```

This allows you to conditionally style the Hover Card based on its rendered side or alignment.

## Offset

The `sideOffset` prop creates a gap between the anchor and Hover Card popup, while `alignmentOffset` slides the Hover Card popup from its alignment, acting logically for `start` and `end` alignments.

```jsx
<HoverCard.Positioner sideOffset={10} alignmentOffset={10}>
```

## Delay

To change how long the Hover Card waits until it opens or closes, use the `delay` and `closeDelay` props, which represent how long the Hover Card waits after the cursor rests on the trigger to open, or moves away from the trigger to close, in milliseconds:

```jsx
<HoverCard.Root delay={200} closeDelay={200}>
```

The delay type can be changed from `"rest"` (user's cursor is static over the trigger for the given timeout in milliseconds) to `"hover"` (the user's cursor has entered the trigger):

```jsx
<HoverCard.Root delayType="hover">
```

## Controlled

To control the Hover Card with external state, use the `open` and `onOpenChange` props:

```jsx
function App() {
  const [open, setOpen] = React.useState(false);
  return (
    <HoverCard.Root open={open} onOpenChange={setOpen}>
      {/* Subcomponents */}
    </HoverCard.Root>
  );
}
```

## Arrow

To add an arrow (caret or triangle) inside the Hover Card content that points toward the center of the anchor element, use the `HoverCard.Arrow` component:

```jsx
<HoverCard.Positioner>
  <HoverCard.Popup>
    <HoverCard.Arrow />
    Hover Card
  </HoverCard.Popup>
</HoverCard.Positioner>
```

It automatically positions a wrapper element that can be styled or contain a custom SVG shape.

## Backdrop

You may dim content behind the Hover Card in order to draw more attention to it by rendering an optional backdrop.

```jsx
<HoverCard.Root>
  <HoverCard.Backdrop />
  {/* Subcomponents */}
</HoverCard.Root>
```

It has the same maximum `z-index` as the `Positioner` component by default, and should be placed before it in the React tree.

## Anchoring

By default, the `Trigger` acts as the anchor, but this can be changed to another element.

- A DOM element (stored in React state):

```jsx
<HoverCard.Positioner anchor={anchorNode}>
```

- A React ref:

```jsx
<HoverCard.Positioner anchor={anchorRef}>
```

- A virtual element object, consisting of a `getBoundingClientRect` method and an optional `contextElement` property:

```jsx
<HoverCard.Positioner
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

The `HoverCard.Positioner` element receives the following CSS variables, which can be used by `HoverCard.Popup`:

- `--anchor-width`: Specifies the width of the anchor element. You can use this to match the width of the Hover Card with its anchor.
- `--anchor-height`: Specifies the height of the anchor element. You can use this to match the height of the Hover Card with its anchor.
- `--available-width`: Specifies the available width of the popup before it overflows the viewport.
- `--available-height`: Specifies the available height of the popup before it overflows the viewport.
- `--transform-origin`: Specifies the origin of the popup element that represents the point of the anchor element's center. When animating scale, this allows it to correctly emanate from the center of the anchor.

### Large content

If your Hover Card is large enough that it cannot fit inside the viewport (especially on small or narrow screens as on mobile devices), the `--available-width` and `--available-height` properties are useful to constrain its size to prevent it from overflowing.

```css
.HoverCardPopup {
  max-width: var(--available-width);
  max-height: var(--available-height);
  overflow: auto;
}
```

The `overflow: auto` property will prevent the `Arrow` from appearing, if specified. You can instead place this on a wrapper child inside the `Popup`:

```jsx
<HoverCard.Popup className="HoverCardPopup">
  <HoverCard.Arrow />
  <div className="HoverCardPopup-content">Large content</div>
</HoverCard.Popup>
```

```css
.HoverCardPopup-content {
  max-width: var(--available-width);
  max-height: var(--available-height);
  overflow: auto;
}
```

Absolute maximums can also be specified if the Hover Card's size can be too large on wider or bigger screens:

```css
.HoverCardPopup-content {
  max-width: min(500px, var(--available-width));
  max-height: min(500px, var(--available-height));
  overflow: auto;
}
```

## Animations

The Hover Card can animate when opening or closing with either:

- CSS transitions
- CSS animations
- JavaScript animations

### CSS transitions

Here is an example of how to apply a symmetric scale and fade transition with the default conditionally-rendered behavior:

```jsx
<HoverCard.Popup className="HoverCardPopup">Hover Card</HoverCard.Popup>
```

```css
.HoverCardPopup {
  transform-origin: var(--transform-origin);
  transition-property: opacity, transform;
  transition-duration: 0.2s;
  /* Represents the final styles once exited */
  opacity: 0;
  transform: scale(0.9);
}

/* Represents the final styles once entered */
.HoverCardPopup[data-state='open'] {
  opacity: 1;
  transform: scale(1);
}

/* Represents the initial styles when entering */
.HoverCardPopup[data-entering] {
  opacity: 0;
  transform: scale(0.9);
}
```

Styles need to be applied in three states:

- The exiting styles, placed on the base element class
- The open styles, placed on the base element class with `[data-state="open"]`
- The entering styles, placed on the base element class with `[data-entering]`

{{"demo": "UnstyledHoverCardTransition.js", "defaultCodeOpen": false}}

In newer browsers, there is a feature called `@starting-style` which allows transitions to occur on open for conditionally-mounted components:

```css
/* Base UI API - Polyfill */
.HoverCardPopup[data-entering] {
  opacity: 0;
  transform: scale(0.9);
}

/* Official Browser API - no Firefox support as of May 2024 */
@starting-style {
  .HoverCardPopup[data-state='open'] {
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

.HoverCardPopup {
  animation: scale-in 0.2s forwards;
}

.HoverCardPopup[data-exiting] {
  animation: scale-out 0.2s forwards;
}
```

### JavaScript animations

The `keepMounted` prop lets an external library control the mounting, for example `framer-motion`'s `AnimatePresence` component.

```js
function App() {
  const [open, setOpen] = useState(false);
  return (
    <HoverCard.Root open={open} onOpenChange={setOpen}>
      <HoverCard.Trigger>Trigger</HoverCard.Trigger>
      <AnimatePresence>
        {open && (
          <HoverCard.Positioner keepMounted>
            <HoverCard.Popup
              render={
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                />
              }
            >
              Hover Card
            </HoverCard.Popup>
          </HoverCard.Positioner>
        )}
      </AnimatePresence>
    </HoverCard.Root>
  );
}
```

### Animation states

Four states are available as data attributes to animate the popup, which enables full control depending on whether the popup is being animated with CSS transitions or animations, JavaScript, or is using the `keepMounted` prop.

- `[data-state="open"]` - `open` state is `true`.
- `[data-state="closed"]` - `open` state is `false`. Can still be mounted to the DOM if closing.
- `[data-entering]` - the popup was just inserted to the DOM. The attribute is removed 1 animation frame later. Enables "starting styles" upon insertion for conditional rendering.
- `[data-exiting]` - the popup is in the process of being removed from the DOM, but is still mounted.

## Overriding default components

Use the `render` prop to override the rendered elements with your own components.

```jsx
// Element shorthand
<HoverCard.Popup render={<MyHoverCardPopup />} />
```

```jsx
// Function
<HoverCard.Popup render={(props) => <MyHoverCardPopup {...props} />} />
```
