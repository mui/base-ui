---
title: Popover
subtitle: An accessible popup anchored to a button.
description: A high-quality, unstyled React popover component that displays an accessible popup anchored to a button.
---
# Popover

A high-quality, unstyled React popover component that displays an accessible popup anchored to a button.

## Demo

### CSS Modules

This example shows how to implement the component using CSS Modules.

```css
/* index.module.css */
.IconButton {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  padding: 0;
  margin: 0;
  outline: 0;
  border: 1px solid var(--color-gray-200);
  border-radius: 0.375rem;
  background-color: var(--color-gray-50);
  color: var(--color-gray-900);
  user-select: none;

  @media (hover: hover) {
    &:hover {
      background-color: var(--color-gray-100);
    }
  }

  &:active {
    background-color: var(--color-gray-100);
  }

  &[data-popup-open] {
    background-color: var(--color-gray-100);
  }

  &:focus-visible {
    outline: 2px solid var(--color-blue);
    outline-offset: -1px;
  }
}

.Icon {
  width: 1.25rem;
  height: 1.25rem;
}

.Popup {
  box-sizing: border-box;
  padding: 1rem 1.5rem;
  border-radius: 0.5rem;
  background-color: canvas;
  color: var(--color-gray-900);
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

.Title {
  margin: 0;
  font-size: 1rem;
  line-height: 1.5rem;
  font-weight: 500;
}

.Description {
  margin: 0;
  font-size: 1rem;
  line-height: 1.5rem;
  color: var(--color-gray-600);
}

.Actions {
  display: flex;
  justify-content: end;
  gap: 1rem;
}
```

```tsx
/* index.tsx */
import * as React from "react";
import { Popover } from "@base-ui-components/react/popover";
import styles from "./index.module.css";

export default function ExamplePopover() {
  return (
    <Popover.Root>
      <Popover.Trigger className={styles.IconButton}>
        <BellIcon aria-label="Notifications" className={styles.Icon} />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={8}>
          <Popover.Popup className={styles.Popup}>
            <Popover.Arrow className={styles.Arrow}>
              <ArrowSvg />
            </Popover.Arrow>
            <Popover.Title className={styles.Title}>
              Notifications
            </Popover.Title>
            <Popover.Description className={styles.Description}>
              You are all caught up. Good job!
            </Popover.Description>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
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

function BellIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg
      fill="currentcolor"
      width="20"
      height="20"
      viewBox="0 0 16 16"
      {...props}
    >
      <path d="M 8 1 C 7.453125 1 7 1.453125 7 2 L 7 3.140625 C 5.28125 3.589844 4 5.144531 4 7 L 4 10.984375 C 4 10.984375 3.984375 11.261719 3.851563 11.519531 C 3.71875 11.78125 3.558594 12 3 12 L 3 13 L 13 13 L 13 12 C 12.40625 12 12.253906 11.78125 12.128906 11.53125 C 12.003906 11.277344 12 11.003906 12 11.003906 L 12 7 C 12 5.144531 10.71875 3.589844 9 3.140625 L 9 2 C 9 1.453125 8.546875 1 8 1 Z M 8 13 C 7.449219 13 7 13.449219 7 14 C 7 14.550781 7.449219 15 8 15 C 8.550781 15 9 14.550781 9 14 C 9 13.449219 8.550781 13 8 13 Z M 8 4 C 9.664063 4 11 5.335938 11 7 L 11 10.996094 C 11 10.996094 10.988281 11.472656 11.234375 11.96875 C 11.238281 11.980469 11.246094 11.988281 11.25 12 L 4.726563 12 C 4.730469 11.992188 4.738281 11.984375 4.742188 11.980469 C 4.992188 11.488281 5 11.015625 5 11.015625 L 5 7 C 5 5.335938 6.335938 4 8 4 Z" />
    </svg>
  );
}
```

### Tailwind

This example shows how to implement the component using Tailwind CSS.

```tsx
/* index.tsx */
import * as React from "react";
import { Popover } from "@base-ui-components/react/popover";

export default function ExamplePopover() {
  return (
    <Popover.Root>
      <Popover.Trigger className="flex size-10 items-center justify-center rounded-md border border-gray-200 bg-gray-50 text-gray-900 select-none hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-100 data-[popup-open]:bg-gray-100">
        <BellIcon aria-label="Notifications" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={8}>
          <Popover.Popup className="origin-[var(--transform-origin)] rounded-lg bg-[canvas] px-6 py-4 text-gray-900 shadow-lg shadow-gray-200 outline outline-1 outline-gray-200 transition-[transform,scale,opacity] data-[ending-style]:scale-90 data-[ending-style]:opacity-0 data-[starting-style]:scale-90 data-[starting-style]:opacity-0 dark:shadow-none dark:-outline-offset-1 dark:outline-gray-300">
            <Popover.Arrow className="data-[side=bottom]:top-[-8px] data-[side=left]:right-[-13px] data-[side=left]:rotate-90 data-[side=right]:left-[-13px] data-[side=right]:-rotate-90 data-[side=top]:bottom-[-8px] data-[side=top]:rotate-180">
              <ArrowSvg />
            </Popover.Arrow>
            <Popover.Title className="text-base font-medium">
              Notifications
            </Popover.Title>
            <Popover.Description className="text-base text-gray-600">
              You are all caught up. Good job!
            </Popover.Description>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
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

function BellIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg
      fill="currentcolor"
      width="20"
      height="20"
      viewBox="0 0 16 16"
      {...props}
    >
      <path d="M 8 1 C 7.453125 1 7 1.453125 7 2 L 7 3.140625 C 5.28125 3.589844 4 5.144531 4 7 L 4 10.984375 C 4 10.984375 3.984375 11.261719 3.851563 11.519531 C 3.71875 11.78125 3.558594 12 3 12 L 3 13 L 13 13 L 13 12 C 12.40625 12 12.253906 11.78125 12.128906 11.53125 C 12.003906 11.277344 12 11.003906 12 11.003906 L 12 7 C 12 5.144531 10.71875 3.589844 9 3.140625 L 9 2 C 9 1.453125 8.546875 1 8 1 Z M 8 13 C 7.449219 13 7 13.449219 7 14 C 7 14.550781 7.449219 15 8 15 C 8.550781 15 9 14.550781 9 14 C 9 13.449219 8.550781 13 8 13 Z M 8 4 C 9.664063 4 11 5.335938 11 7 L 11 10.996094 C 11 10.996094 10.988281 11.472656 11.234375 11.96875 C 11.238281 11.980469 11.246094 11.988281 11.25 12 L 4.726563 12 C 4.730469 11.992188 4.738281 11.984375 4.742188 11.980469 C 4.992188 11.488281 5 11.015625 5 11.015625 L 5 7 C 5 5.335938 6.335938 4 8 4 Z" />
    </svg>
  );
}
```

## API reference

Import the component and assemble its parts:

```jsx title="Anatomy"
import { Popover } from "@base-ui-components/react/popover";

<Popover.Root>
  <Popover.Trigger />
  <Popover.Portal>
    <Popover.Backdrop />
    <Popover.Positioner>
      <Popover.Popup>
        <Popover.Arrow />
        <Popover.Title />
        <Popover.Description />
        <Popover.Close />
      </Popover.Popup>
    </Popover.Positioner>
  </Popover.Portal>
</Popover.Root>;
```

### Root

Groups all parts of the popover.
Doesn’t render its own HTML element.

**Root Props:**

| Prop                 | Type                             | Default | Description                                                                                                                          |
| :------------------- | :------------------------------- | :------ | :----------------------------------------------------------------------------------------------------------------------------------- |
| defaultOpen          | `boolean`                        | `false` | Whether the popover is initially open.To render a controlled popover, use the `open` prop instead.                                   |
| open                 | `boolean`                        | -       | Whether the popover is currently open.                                                                                               |
| onOpenChange         | `(open, event, reason) => void`  | -       | Event handler called when the popover is opened or closed.                                                                           |
| actionsRef           | `{ current: { unmount: func } }` | -       | A ref to imperative actions.                                                                                                         |
| modal                | `boolean`                        | `false` | Whether the popover should prevent outside clicks and lock page scroll when open.                                                    |
| onOpenChangeComplete | `(open) => void`                 | -       | Event handler called after any animations complete when the popover is opened or closed.                                             |
| openOnHover          | `boolean`                        | `false` | Whether the popover should also open when the trigger is hovered.                                                                    |
| delay                | `number`                         | `300`   | How long to wait before the popover may be opened on hover. Specified in milliseconds.Requires the `openOnHover` prop.               |
| closeDelay           | `number`                         | `0`     | How long to wait before closing the popover that was opened on hover.&#xA;Specified in milliseconds.Requires the `openOnHover` prop. |

### Trigger

A button that opens the popover.
Renders a `<button>` element.

**Trigger Props:**

| Prop      | Type                                                         | Default | Description                                                                                                                                                                                  |
| :-------- | :----------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| className | `string \| (state) => string`                                | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render    | `React.ReactElement \| (props, state) => React.ReactElement` | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

**Trigger Data Attributes:**

| Attribute       | Type | Description                                     |
| :-------------- | :--- | :---------------------------------------------- |
| data-popup-open | -    | Present when the corresponding popover is open. |
| data-pressed    | -    | Present when the trigger is pressed.            |

### Backdrop

An overlay displayed beneath the popover.
Renders a `<div>` element.

**Backdrop Props:**

| Prop      | Type                                                         | Default | Description                                                                                                                                                                                  |
| :-------- | :----------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| className | `string \| (state) => string`                                | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render    | `React.ReactElement \| (props, state) => React.ReactElement` | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

**Backdrop Data Attributes:**

| Attribute           | Type | Description                              |
| :------------------ | :--- | :--------------------------------------- |
| data-open           | -    | Present when the popup is open.          |
| data-closed         | -    | Present when the popup is closed.        |
| data-starting-style | -    | Present when the popup is animating in.  |
| data-ending-style   | -    | Present when the popup is animating out. |

### Portal

A portal element that moves the popup to a different part of the DOM.
By default, the portal element is appended to `<body>`.

**Portal Props:**

| Prop        | Type                               | Default | Description                                                              |
| :---------- | :--------------------------------- | :------ | :----------------------------------------------------------------------- |
| container   | `React.Ref \| HTMLElement \| null` | -       | A parent element to render the portal element into.                      |
| keepMounted | `boolean`                          | `false` | Whether to keep the portal mounted in the DOM while the popup is hidden. |

### Positioner

Positions the popover against the trigger.
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

| Attribute          | Type                                                                       | Description                                                           |
| :----------------- | :------------------------------------------------------------------------- | :-------------------------------------------------------------------- |
| data-open          | -                                                                          | Present when the popup is open.                                       |
| data-closed        | -                                                                          | Present when the popup is closed.                                     |
| data-anchor-hidden | -                                                                          | Present when the anchor is hidden.                                    |
| data-side          | `'top' \| 'bottom' \| 'left' \| 'right' \| 'inline-end' \| 'inline-start'` | Indicates which side the popup is positioned relative to the trigger. |

**Positioner CSS Variables:**

| Variable           | Type     | Default | Description                                                                            |
| :----------------- | :------- | :------ | :------------------------------------------------------------------------------------- |
| --anchor-height    | `number` | -       | The anchor's height.                                                                   |
| --anchor-width     | `number` | -       | The anchor's width.                                                                    |
| --available-height | `number` | -       | The available height between the trigger and the edge of the viewport.                 |
| --available-width  | `number` | -       | The available width between the trigger and the edge of the viewport.                  |
| --transform-origin | `string` | -       | The coordinates that this element is anchored to. Used for animations and transitions. |

### Popup

A container for the popover contents.
Renders a `<div>` element.

**Popup Props:**

| Prop         | Type                                                         | Default | Description                                                                                                                                                                                  |
| :----------- | :----------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| initialFocus | `React.Ref \| (interactionType => HTMLElement \| null)`      | -       | Determines the element to focus when the popover is opened.&#xA;By default, the first focusable element is focused.                                                                          |
| finalFocus   | `React.Ref`                                                  | -       | Determines the element to focus when the popover is closed.&#xA;By default, focus returns to the trigger.                                                                                    |
| className    | `string \| (state) => string`                                | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render       | `React.ReactElement \| (props, state) => React.ReactElement` | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

**Popup Data Attributes:**

| Attribute           | Type                                                                       | Description                                                           |
| :------------------ | :------------------------------------------------------------------------- | :-------------------------------------------------------------------- |
| data-open           | -                                                                          | Present when the popup is open.                                       |
| data-closed         | -                                                                          | Present when the popup is closed.                                     |
| data-instant        | `'click' \| 'dismiss'`                                                     | Present if animations should be instant.                              |
| data-side           | `'top' \| 'bottom' \| 'left' \| 'right' \| 'inline-end' \| 'inline-start'` | Indicates which side the popup is positioned relative to the trigger. |
| data-starting-style | -                                                                          | Present when the popup is animating in.                               |
| data-ending-style   | -                                                                          | Present when the popup is animating out.                              |

### Arrow

Displays an element positioned against the popover anchor.
Renders a `<div>` element.

**Arrow Props:**

| Prop      | Type                                                         | Default | Description                                                                                                                                                                                  |
| :-------- | :----------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| className | `string \| (state) => string`                                | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render    | `React.ReactElement \| (props, state) => React.ReactElement` | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

**Arrow Data Attributes:**

| Attribute          | Type                                                                       | Description                                                           |
| :----------------- | :------------------------------------------------------------------------- | :-------------------------------------------------------------------- |
| data-open          | -                                                                          | Present when the popup is open.                                       |
| data-closed        | -                                                                          | Present when the popup is closed.                                     |
| data-uncentered    | -                                                                          | Present when the popover arrow is uncentered.                         |
| data-anchor-hidden | -                                                                          | Present when the anchor is hidden.                                    |
| data-side          | `'top' \| 'bottom' \| 'left' \| 'right' \| 'inline-end' \| 'inline-start'` | Indicates which side the popup is positioned relative to the trigger. |

### Title

A heading that labels the popover.
Renders an `<h2>` element.

**Title Props:**

| Prop      | Type                                                         | Default | Description                                                                                                                                                                                  |
| :-------- | :----------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| className | `string \| (state) => string`                                | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render    | `React.ReactElement \| (props, state) => React.ReactElement` | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

### Description

A paragraph with additional information about the popover.
Renders a `<p>` element.

**Description Props:**

| Prop      | Type                                                         | Default | Description                                                                                                                                                                                  |
| :-------- | :----------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| className | `string \| (state) => string`                                | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render    | `React.ReactElement \| (props, state) => React.ReactElement` | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

### Close

A button that closes the popover.
Renders a `<button>` element.

**Close Props:**

| Prop      | Type                                                         | Default | Description                                                                                                                                                                                  |
| :-------- | :----------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| className | `string \| (state) => string`                                | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render    | `React.ReactElement \| (props, state) => React.ReactElement` | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |
