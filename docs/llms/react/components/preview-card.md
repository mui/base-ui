---
title: Preview Card
subtitle: A popup that appears when a link is hovered, showing a preview for sighted users.
description: A high-quality, unstyled React preview card component that appears when a link is hovered, showing a preview for sighted users.
---
# Preview Card

<Meta name="description" content="A high-quality, unstyled React preview card component that appears when a link is hovered, showing a preview for sighted users." />

## Demo

### CSS Modules

This example shows how to implement the component using CSS Modules.

```css
/* index.module.css */
.Paragraph {
  margin: 0;
  font-size: 1rem;
  line-height: 1.5rem;
  color: var(--color-gray-900);
  text-wrap: balance;
  max-width: 16rem;
}

.Link {
  outline: 0;
  color: var(--color-blue);
  text-decoration-line: none;
  text-decoration-thickness: 1px;
  text-decoration-color: color-mix(
    in oklab,
    var(--color-blue),
    transparent 40%
  );
  text-underline-offset: 2px;

  @media (hover: hover) {
    &:hover {
      text-decoration-line: underline;
    }
  }

  &[data-popup-open] {
    text-decoration-line: underline;
  }

  &:focus-visible {
    border-radius: 0.125rem;
    outline: 2px solid var(--color-blue);
    text-decoration-line: none;
  }
}

.Popup {
  box-sizing: border-box;
  width: 240px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: 0.5rem;
  background-color: canvas;
  transform-origin: var(--transform-origin);
  transition:
    transform 150ms,
    opacity 150ms;

  &[data-starting-style],
  &[data-ending-style] {
    opacity: 0;
    transform: scale(0.9);
  }

  @media (prefers-color-scheme: light) {
    outline: 1px solid var(--color-gray-200);
    box-shadow:
      0 10px 15px -3px var(--color-gray-200),
      0 4px 6px -4px var(--color-gray-200);
  }

  @media (prefers-color-scheme: dark) {
    outline: 1px solid var(--color-gray-300);
    outline-offset: -1px;
  }
}

.Arrow {
  display: flex;

  &[data-side="top"] {
    bottom: -8px;
    rotate: 180deg;
  }

  &[data-side="bottom"] {
    top: -8px;
    rotate: 0deg;
  }

  &[data-side="left"] {
    right: -13px;
    rotate: 90deg;
  }

  &[data-side="right"] {
    left: -13px;
    rotate: -90deg;
  }
}

.ArrowFill {
  fill: canvas;
}

.ArrowOuterStroke {
  @media (prefers-color-scheme: light) {
    fill: var(--color-gray-200);
  }
}

.ArrowInnerStroke {
  @media (prefers-color-scheme: dark) {
    fill: var(--color-gray-300);
  }
}

.Image {
  display: block;
  width: 100%;
  height: auto;
  border-radius: 0.25rem;
}

.Summary {
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.25rem;
  color: var(--color-gray-900);
  text-wrap: pretty;
}
```

```tsx
/* index.tsx */
import * as React from "react";
import { PreviewCard } from "@base-ui-components/react/preview-card";
import styles from "./index.module.css";

export default function ExamplePreviewCard() {
  return (
    <PreviewCard.Root>
      <p className={styles.Paragraph}>
        The principles of good{" "}
        <PreviewCard.Trigger
          className={styles.Link}
          href="https://en.wikipedia.org/wiki/Typography"
        >
          typography
        </PreviewCard.Trigger>{" "}
        remain into the digital age.
      </p>

      <PreviewCard.Portal>
        <PreviewCard.Positioner sideOffset={8}>
          <PreviewCard.Popup className={styles.Popup}>
            <PreviewCard.Arrow className={styles.Arrow}>
              <ArrowSvg />
            </PreviewCard.Arrow>
            <img
              width="448"
              height="300"
              className={styles.Image}
              src="https://images.unsplash.com/photo-1619615391095-dfa29e1672ef?q=80&w=448&h=300"
              alt="Station Hofplein signage in Rotterdam, Netherlands"
            />
            <p className={styles.Summary}>
              <strong>Typography</strong> is the art and science of arranging
              type to make written language clear, visually appealing, and
              effective in communication.
            </p>
          </PreviewCard.Popup>
        </PreviewCard.Positioner>
      </PreviewCard.Portal>
    </PreviewCard.Root>
  );
}

function ArrowSvg(props: React.ComponentProps<"svg">) {
  return (
    <svg width="20" height="10" viewBox="0 0 20 10" fill="none" {...props}>
      <path
        d="M9.66437 2.60207L4.80758 6.97318C4.07308 7.63423 3.11989 8 2.13172 8H0V10H20V8H18.5349C17.5468 8 16.5936 7.63423 15.8591 6.97318L11.0023 2.60207C10.622 2.2598 10.0447 2.25979 9.66437 2.60207Z"
        className={styles.ArrowFill}
      />
      <path
        d="M8.99542 1.85876C9.75604 1.17425 10.9106 1.17422 11.6713 1.85878L16.5281 6.22989C17.0789 6.72568 17.7938 7.00001 18.5349 7.00001L15.89 7L11.0023 2.60207C10.622 2.2598 10.0447 2.2598 9.66436 2.60207L4.77734 7L2.13171 7.00001C2.87284 7.00001 3.58774 6.72568 4.13861 6.22989L8.99542 1.85876Z"
        className={styles.ArrowOuterStroke}
      />
      <path
        d="M10.3333 3.34539L5.47654 7.71648C4.55842 8.54279 3.36693 9 2.13172 9H0V8H2.13172C3.11989 8 4.07308 7.63423 4.80758 6.97318L9.66437 2.60207C10.0447 2.25979 10.622 2.2598 11.0023 2.60207L15.8591 6.97318C16.5936 7.63423 17.5468 8 18.5349 8H20V9H18.5349C17.2998 9 16.1083 8.54278 15.1901 7.71648L10.3333 3.34539Z"
        className={styles.ArrowInnerStroke}
      />
    </svg>
  );
}
```

### Tailwind

This example shows how to implement the component using Tailwind CSS.

```tsx
/* index.tsx */
import * as React from "react";
import { PreviewCard } from "@base-ui-components/react/preview-card";

export default function ExamplePreviewCard() {
  return (
    <PreviewCard.Root>
      <p className="max-w-64 text-base text-balance text-gray-900">
        The principles of good{" "}
        <PreviewCard.Trigger
          className="text-blue-800 no-underline decoration-blue-800/60 decoration-1 underline-offset-2 outline-none hover:underline focus-visible:rounded-sm focus-visible:no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-800 data-[popup-open]:underline data-[popup-open]:focus-visible:no-underline"
          href="https://en.wikipedia.org/wiki/Typography"
        >
          typography
        </PreviewCard.Trigger>{" "}
        remain into the digital age.
      </p>

      <PreviewCard.Portal>
        <PreviewCard.Positioner sideOffset={8}>
          <PreviewCard.Popup className="flex w-[240px] origin-[var(--transform-origin)] flex-col gap-2 rounded-lg bg-[canvas] p-2 shadow-lg shadow-gray-200 outline outline-1 outline-gray-200 transition-[transform,scale,opacity] data-[ending-style]:scale-90 data-[ending-style]:opacity-0 data-[starting-style]:scale-90 data-[starting-style]:opacity-0 dark:shadow-none dark:-outline-offset-1 dark:outline-gray-300">
            <PreviewCard.Arrow className="data-[side=bottom]:top-[-8px] data-[side=left]:right-[-13px] data-[side=left]:rotate-90 data-[side=right]:left-[-13px] data-[side=right]:-rotate-90 data-[side=top]:bottom-[-8px] data-[side=top]:rotate-180">
              <ArrowSvg />
            </PreviewCard.Arrow>
            <img
              width="448"
              height="300"
              className="block w-full rounded-sm"
              src="https://images.unsplash.com/photo-1619615391095-dfa29e1672ef?q=80&w=448&h=300"
              alt="Station Hofplein signage in Rotterdam, Netherlands"
            />
            <p className="text-sm text-pretty text-gray-900">
              <strong>Typography</strong> is the art and science of arranging
              type to make written language clear, visually appealing, and
              effective in communication.
            </p>
          </PreviewCard.Popup>
        </PreviewCard.Positioner>
      </PreviewCard.Portal>
    </PreviewCard.Root>
  );
}

function ArrowSvg(props: React.ComponentProps<"svg">) {
  return (
    <svg width="20" height="10" viewBox="0 0 20 10" fill="none" {...props}>
      <path
        d="M9.66437 2.60207L4.80758 6.97318C4.07308 7.63423 3.11989 8 2.13172 8H0V10H20V8H18.5349C17.5468 8 16.5936 7.63423 15.8591 6.97318L11.0023 2.60207C10.622 2.2598 10.0447 2.25979 9.66437 2.60207Z"
        className="fill-[canvas]"
      />
      <path
        d="M8.99542 1.85876C9.75604 1.17425 10.9106 1.17422 11.6713 1.85878L16.5281 6.22989C17.0789 6.72568 17.7938 7.00001 18.5349 7.00001L15.89 7L11.0023 2.60207C10.622 2.2598 10.0447 2.2598 9.66436 2.60207L4.77734 7L2.13171 7.00001C2.87284 7.00001 3.58774 6.72568 4.13861 6.22989L8.99542 1.85876Z"
        className="fill-gray-200 dark:fill-none"
      />
      <path
        d="M10.3333 3.34539L5.47654 7.71648C4.55842 8.54279 3.36693 9 2.13172 9H0V8H2.13172C3.11989 8 4.07308 7.63423 4.80758 6.97318L9.66437 2.60207C10.0447 2.25979 10.622 2.2598 11.0023 2.60207L15.8591 6.97318C16.5936 7.63423 17.5468 8 18.5349 8H20V9H18.5349C17.2998 9 16.1083 8.54278 15.1901 7.71648L10.3333 3.34539Z"
        className="dark:fill-gray-300"
      />
    </svg>
  );
}
```

## API reference

Import the component and assemble its parts:

```jsx title="Anatomy"
import { PreviewCard } from "@base-ui-components/react/previewCard";

<PreviewCard.Root>
  <PreviewCard.Trigger />
  <PreviewCard.Portal>
    <PreviewCard.Backdrop />
    <PreviewCard.Positioner>
      <PreviewCard.Popup>
        <PreviewCard.Arrow />
      </PreviewCard.Popup>
    </PreviewCard.Positioner>
  </PreviewCard.Portal>
</PreviewCard.Root>;
```

### Root

Groups all parts of the preview card.
Doesn’t render its own HTML element.

**Root Props:**

| Prop                 | Type                             | Default | Description                                                                                                  |
| :------------------- | :------------------------------- | :------ | :----------------------------------------------------------------------------------------------------------- |
| defaultOpen          | `boolean`                        | `false` | Whether the preview card is initially open.To render a controlled preview card, use the `open` prop instead. |
| open                 | `boolean`                        | -       | Whether the preview card is currently open.                                                                  |
| onOpenChange         | `(open, event, reason) => void`  | -       | Event handler called when the preview card is opened or closed.                                              |
| actionsRef           | `{ current: { unmount: func } }` | -       | A ref to imperative actions.                                                                                 |
| onOpenChangeComplete | `(open) => void`                 | -       | Event handler called after any animations complete when the preview card is opened or closed.                |
| delay                | `number`                         | `600`   | How long to wait before the preview card opens. Specified in milliseconds.                                   |
| closeDelay           | `number`                         | `300`   | How long to wait before closing the preview card. Specified in milliseconds.                                 |

### Trigger

A link that opens the preview card.
Renders an `<a>` element.

**Trigger Props:**

| Prop      | Type                                                         | Default | Description                                                                                                                                                                                  |
| :-------- | :----------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| className | `string \| (state) => string`                                | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render    | `React.ReactElement \| (props, state) => React.ReactElement` | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

**Trigger Data Attributes:**

| Attribute       | Type | Description                                          |
| :-------------- | :--- | :--------------------------------------------------- |
| data-popup-open | -    | Present when the corresponding preview card is open. |

### Portal

A portal element that moves the popup to a different part of the DOM.
By default, the portal element is appended to `<body>`.

**Portal Props:**

| Prop        | Type                               | Default | Description                                                              |
| :---------- | :--------------------------------- | :------ | :----------------------------------------------------------------------- |
| container   | `React.Ref \| HTMLElement \| null` | -       | A parent element to render the portal element into.                      |
| keepMounted | `boolean`                          | `false` | Whether to keep the portal mounted in the DOM while the popup is hidden. |

### Backdrop

An overlay displayed beneath the popup.
Renders a `<div>` element.

**Backdrop Props:**

| Prop      | Type                                                         | Default | Description                                                                                                                                                                                  |
| :-------- | :----------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| className | `string \| (state) => string`                                | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render    | `React.ReactElement \| (props, state) => React.ReactElement` | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

**Backdrop Data Attributes:**

| Attribute           | Type | Description                                     |
| :------------------ | :--- | :---------------------------------------------- |
| data-open           | -    | Present when the preview card is open.          |
| data-closed         | -    | Present when the preview card is closed.        |
| data-starting-style | -    | Present when the preview card is animating in.  |
| data-ending-style   | -    | Present when the preview card is animating out. |

### Positioner

Positions the popup against the trigger.
Renders a `<div>` element.

**Positioner Props:**

| Prop        | Type                           | Default    | Description                                                                                                                                                                                                                                                                                                |
| :---------- | :----------------------------- | :--------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| align       | `'start' \| 'center' \| 'end'` | `'center'` | How to align the popup relative to the specified side.                                                                                                                                                                                                                                                     |
| alignOffset | `number \| (data) => number`   | `0`        | Additional offset along the alignment axis in pixels.&#xA;Also accepts a function that returns the offset to read the dimensions of the anchor&#xA;and positioner elements, along with its side and alignment.\* `data.anchor`: the dimensions of the anchor element with properties `width` and `height`. |

- `data.positioner`: the dimensions of the positioner element with properties `width` and `height`.
- `data.side`: which side of the anchor element the positioner is aligned against.
- `data.align`: how the positioner is aligned relative to the specified side. |
  | side | `'bottom' \| 'inline-end' \| 'inline-start' \| 'left' \| 'right' \| 'top'` | `'bottom'` | Which side of the anchor element to align the popup against.&#xA;May automatically change to avoid collisions. |
  | sideOffset | `number \| (data) => number` | `0` | Distance between the anchor and the popup in pixels.&#xA;Also accepts a function that returns the distance to read the dimensions of the anchor&#xA;and positioner elements, along with its side and alignment.\* `data.anchor`: the dimensions of the anchor element with properties `width` and `height`.
- `data.positioner`: the dimensions of the positioner element with properties `width` and `height`.
- `data.side`: which side of the anchor element the positioner is aligned against.
- `data.align`: how the positioner is aligned relative to the specified side. |
  | arrowPadding | `number` | `5` | Minimum distance to maintain between the arrow and the edges of the popup.Use it to prevent the arrow element from hanging out of the rounded corners of a popup. |
  | anchor | `React.Ref \| Element \| VirtualElement \| (() => Element \| VirtualElement \| null) \| null` | - | An element to position the popup against.&#xA;By default, the popup will be positioned against the trigger. |
  | collisionBoundary | `'clipping-ancestors' \| Element \| Element[] \| Rect` | `'clipping-ancestors'` | An element or a rectangle that delimits the area that the popup is confined to. |
  | collisionPadding | `number \| Rect` | `5` | Additional space to maintain from the edge of the collision boundary. |
  | sticky | `boolean` | `false` | Whether to maintain the popup in the viewport after&#xA;the anchor element was scrolled out of view. |
  | positionMethod | `'absolute' \| 'fixed'` | `'absolute'` | Determines which CSS `position` property to use. |
  | trackAnchor | `boolean` | `true` | Whether the popup tracks any layout shift of its positioning anchor. |
  | className | `string \| (state) => string` | - | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state. |
  | render | `React.ReactElement \| (props, state) => React.ReactElement` | - | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

**Positioner Data Attributes:**

| Attribute          | Type                                                                       | Description                                                                  |
| :----------------- | :------------------------------------------------------------------------- | :--------------------------------------------------------------------------- |
| data-open          | -                                                                          | Present when the preview card is open.                                       |
| data-closed        | -                                                                          | Present when the preview card is closed.                                     |
| data-anchor-hidden | -                                                                          | Present when the anchor is hidden.                                           |
| data-side          | `'top' \| 'bottom' \| 'left' \| 'right' \| 'inline-end' \| 'inline-start'` | Indicates which side the preview card is positioned relative to the trigger. |

**Positioner CSS Variables:**

| Variable           | Type     | Default | Description                                                                            |
| :----------------- | :------- | :------ | :------------------------------------------------------------------------------------- |
| --anchor-height    | `number` | -       | The anchor's height.                                                                   |
| --anchor-width     | `number` | -       | The anchor's width.                                                                    |
| --available-height | `number` | -       | The available height between the trigger and the edge of the viewport.                 |
| --available-width  | `number` | -       | The available width between the trigger and the edge of the viewport.                  |
| --transform-origin | `string` | -       | The coordinates that this element is anchored to. Used for animations and transitions. |

### Popup

A container for the preview card contents.
Renders a `<div>` element.

**Popup Props:**

| Prop      | Type                                                         | Default | Description                                                                                                                                                                                  |
| :-------- | :----------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| className | `string \| (state) => string`                                | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render    | `React.ReactElement \| (props, state) => React.ReactElement` | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

**Popup Data Attributes:**

| Attribute           | Type                                                                       | Description                                                                  |
| :------------------ | :------------------------------------------------------------------------- | :--------------------------------------------------------------------------- |
| data-open           | -                                                                          | Present when the preview card is open.                                       |
| data-closed         | -                                                                          | Present when the preview card is closed.                                     |
| data-side           | `'top' \| 'bottom' \| 'left' \| 'right' \| 'inline-end' \| 'inline-start'` | Indicates which side the preview card is positioned relative to the trigger. |
| data-starting-style | -                                                                          | Present when the preview card is animating in.                               |
| data-ending-style   | -                                                                          | Present when the preview card is animating out.                              |

### Arrow

Displays an element positioned against the preview card anchor.
Renders a `<div>` element.

**Arrow Props:**

| Prop      | Type                                                         | Default | Description                                                                                                                                                                                  |
| :-------- | :----------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| className | `string \| (state) => string`                                | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render    | `React.ReactElement \| (props, state) => React.ReactElement` | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

**Arrow Data Attributes:**

| Attribute          | Type                                                                       | Description                                                                  |
| :----------------- | :------------------------------------------------------------------------- | :--------------------------------------------------------------------------- |
| data-open          | -                                                                          | Present when the preview card is open.                                       |
| data-closed        | -                                                                          | Present when the preview card is closed.                                     |
| data-uncentered    | -                                                                          | Present when the preview card arrow is uncentered.                           |
| data-anchor-hidden | -                                                                          | Present when the anchor is hidden.                                           |
| data-side          | `'top' \| 'bottom' \| 'left' \| 'right' \| 'inline-end' \| 'inline-start'` | Indicates which side the preview card is positioned relative to the trigger. |
