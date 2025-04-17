---
title: Select
subtitle: A common form component for choosing a predefined value in a dropdown menu.
description: A high-quality, unstyled React select component that allows you for choosing a predefined value in a dropdown menu.
---
# Select

A high-quality, unstyled React select component that allows you for choosing a predefined value in a dropdown menu.

## Demo

### CSS Modules

This example shows how to implement the component using CSS Modules.

```css
/* index.module.css */
.Select {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  height: 2.5rem;
  padding-left: 0.875rem;
  padding-right: 0.75rem;
  margin: 0;
  outline: 0;
  border: 1px solid var(--color-gray-200);
  border-radius: 0.375rem;
  font-family: inherit;
  font-size: 1rem;
  line-height: 1.5rem;
  color: var(--color-gray-900);
  cursor: default;
  user-select: none;
  min-width: 9rem;

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

.SelectIcon {
  display: flex;
}

.Popup {
  box-sizing: border-box;
  padding-block: 0.25rem;
  border-radius: 0.375rem;
  background-color: canvas;
  color: var(--color-gray-900);
  transform-origin: var(--transform-origin);
  transition:
    transform 150ms,
    opacity 150ms;
  overflow-y: auto;
  max-height: var(--available-height);

  &[data-starting-style],
  &[data-ending-style] {
    opacity: 0;
    transform: scale(0.9);
  }

  &[data-side="none"] {
    transition: none;
    transform: none;
    opacity: 1;
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

.Item {
  box-sizing: border-box;
  outline: 0;
  font-size: 0.875rem;
  line-height: 1rem;
  padding-block: 0.5rem;
  padding-left: 0.625rem;
  padding-right: 1rem;
  min-width: var(--anchor-width);
  display: grid;
  gap: 0.5rem;
  align-items: center;
  grid-template-columns: 0.75rem 1fr;
  cursor: default;
  user-select: none;
  scroll-margin-block: 1rem;

  [data-side="none"] & {
    font-size: 1rem;
    padding-right: 3rem;
    min-width: calc(var(--anchor-width) + 1rem);
  }

  &[data-highlighted] {
    z-index: 0;
    position: relative;
    color: var(--color-gray-50);
  }

  &[data-highlighted]::before {
    content: "";
    z-index: -1;
    position: absolute;
    inset-block: 0;
    inset-inline: 0.25rem;
    border-radius: 0.25rem;
    background-color: var(--color-gray-900);
  }
}

.ItemIndicator {
  grid-column-start: 1;
}

.ItemIndicatorIcon {
  display: block;
  width: 0.75rem;
  height: 0.75rem;
}

.ItemText {
  grid-column-start: 2;
}

.ScrollArrow {
  width: 100%;
  background: canvas;
  z-index: 1;
  text-align: center;
  cursor: default;
  border-radius: 0.375rem;
  height: 1rem;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;

  &::before {
    content: "";
    position: absolute;
    width: 100%;
    height: 100%;
    left: 0;
  }

  &[data-direction="up"] {
    &::before {
      top: -100%;
    }
  }

  &[data-direction="down"] {
    bottom: 0;

    &::before {
      bottom: -100%;
    }
  }
}
```

```tsx
/* index.tsx */
import * as React from "react";
import { Select } from "@base-ui-components/react/select";
import styles from "./index.module.css";

export default function ExampleSelect() {
  return (
    <Select.Root defaultValue="sans">
      <Select.Trigger className={styles.Select}>
        <Select.Value placeholder="Sans-serif" />
        <Select.Icon className={styles.SelectIcon}>
          <ChevronUpDownIcon />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner className={styles.Positioner} sideOffset={8}>
          <Select.ScrollUpArrow className={styles.ScrollArrow} />
          <Select.Popup className={styles.Popup}>
            <Select.Arrow className={styles.Arrow}>
              <ArrowSvg />
            </Select.Arrow>
            <Select.Item className={styles.Item} value="sans">
              <Select.ItemIndicator className={styles.ItemIndicator}>
                <CheckIcon className={styles.ItemIndicatorIcon} />
              </Select.ItemIndicator>
              <Select.ItemText className={styles.ItemText}>
                Sans-serif
              </Select.ItemText>
            </Select.Item>
            <Select.Item className={styles.Item} value="serif">
              <Select.ItemIndicator className={styles.ItemIndicator}>
                <CheckIcon className={styles.ItemIndicatorIcon} />
              </Select.ItemIndicator>
              <Select.ItemText className={styles.ItemText}>
                Serif
              </Select.ItemText>
            </Select.Item>
            <Select.Item className={styles.Item} value="mono">
              <Select.ItemIndicator className={styles.ItemIndicator}>
                <CheckIcon className={styles.ItemIndicatorIcon} />
              </Select.ItemIndicator>
              <Select.ItemText className={styles.ItemText}>
                Monospace
              </Select.ItemText>
            </Select.Item>
            <Select.Item className={styles.Item} value="cursive">
              <Select.ItemIndicator className={styles.ItemIndicator}>
                <CheckIcon className={styles.ItemIndicatorIcon} />
              </Select.ItemIndicator>
              <Select.ItemText className={styles.ItemText}>
                Cursive
              </Select.ItemText>
            </Select.Item>
          </Select.Popup>
          <Select.ScrollDownArrow className={styles.ScrollArrow} />
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
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

function ChevronUpDownIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg
      width="8"
      height="12"
      viewBox="0 0 8 12"
      fill="none"
      stroke="currentcolor"
      strokeWidth="1.5"
      {...props}
    >
      <path d="M0.5 4.5L4 1.5L7.5 4.5" />
      <path d="M0.5 7.5L4 10.5L7.5 7.5" />
    </svg>
  );
}

function CheckIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg
      fill="currentcolor"
      width="10"
      height="10"
      viewBox="0 0 10 10"
      {...props}
    >
      <path d="M9.1603 1.12218C9.50684 1.34873 9.60427 1.81354 9.37792 2.16038L5.13603 8.66012C5.01614 8.8438 4.82192 8.96576 4.60451 8.99384C4.3871 9.02194 4.1683 8.95335 4.00574 8.80615L1.24664 6.30769C0.939709 6.02975 0.916013 5.55541 1.19372 5.24822C1.47142 4.94102 1.94536 4.91731 2.2523 5.19524L4.36085 7.10461L8.12299 1.33999C8.34934 0.993152 8.81376 0.895638 9.1603 1.12218Z" />
    </svg>
  );
}
```

### Tailwind

This example shows how to implement the component using Tailwind CSS.

```tsx
/* index.tsx */
import * as React from "react";
import { Select } from "@base-ui-components/react/select";

export default function ExampleSelect() {
  return (
    <Select.Root defaultValue="sans">
      <Select.Trigger className="flex h-10 min-w-36 items-center justify-between gap-3 rounded-md border border-gray-200 pr-3 pl-3.5 text-base text-gray-900 select-none hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-100 data-[popup-open]:bg-gray-100">
        <Select.Value placeholder="Sans-serif" />
        <Select.Icon className="flex">
          <ChevronUpDownIcon />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner className="outline-none" sideOffset={8}>
          <Select.ScrollUpArrow className="top-0 z-[1] flex h-4 w-full cursor-default items-center justify-center rounded-md bg-[canvas] text-center text-xs before:absolute before:top-[-100%] before:left-0 before:h-full before:w-full before:content-[''] data-[direction=down]:bottom-0 data-[direction=down]:before:bottom-[-100%]" />
          <Select.Popup className="group [max-height:var(--available-height)] origin-[var(--transform-origin)] overflow-y-auto rounded-md bg-[canvas] py-1 text-gray-900 shadow-lg shadow-gray-200 outline outline-1 outline-gray-200 transition-[transform,scale,opacity] data-[ending-style]:scale-90 data-[ending-style]:scale-100 data-[ending-style]:opacity-0 data-[ending-style]:opacity-100 data-[ending-style]:transition-none data-[starting-style]:scale-90 data-[starting-style]:opacity-0 data-[side=none]:data-[starting-style]:scale-100 data-[side=none]:data-[starting-style]:opacity-100 data-[side=none]:data-[starting-style]:transition-none dark:shadow-none dark:-outline-offset-1 dark:outline-gray-300">
            <Select.Arrow className="data-[side=bottom]:top-[-8px] data-[side=left]:right-[-13px] data-[side=left]:rotate-90 data-[side=right]:left-[-13px] data-[side=right]:-rotate-90 data-[side=top]:bottom-[-8px] data-[side=top]:rotate-180">
              <ArrowSvg />
            </Select.Arrow>
            <Select.Item
              className="grid min-w-[var(--anchor-width)] cursor-default grid-cols-[0.75rem_1fr] items-center gap-2 py-2 pr-4 pl-2.5 text-sm leading-4 outline-none select-none group-data-[side=none]:min-w-[calc(var(--anchor-width)+1rem)] group-data-[side=none]:pr-12 group-data-[side=none]:text-base group-data-[side=none]:leading-4 data-[highlighted]:relative data-[highlighted]:z-0 data-[highlighted]:text-gray-50 data-[highlighted]:before:absolute data-[highlighted]:before:inset-x-1 data-[highlighted]:before:inset-y-0 data-[highlighted]:before:z-[-1] data-[highlighted]:before:rounded-sm data-[highlighted]:before:bg-gray-900"
              value="sans"
            >
              <Select.ItemIndicator className="col-start-1">
                <CheckIcon className="size-3" />
              </Select.ItemIndicator>
              <Select.ItemText className="col-start-2">
                Sans-serif
              </Select.ItemText>
            </Select.Item>
            <Select.Item
              className="grid min-w-[var(--anchor-width)] cursor-default grid-cols-[0.75rem_1fr] items-center gap-2 py-2 pr-4 pl-2.5 text-sm leading-4 outline-none select-none group-data-[side=none]:min-w-[calc(var(--anchor-width)+1rem)] group-data-[side=none]:pr-12 group-data-[side=none]:text-base group-data-[side=none]:leading-4 data-[highlighted]:relative data-[highlighted]:z-0 data-[highlighted]:text-gray-50 data-[highlighted]:before:absolute data-[highlighted]:before:inset-x-1 data-[highlighted]:before:inset-y-0 data-[highlighted]:before:z-[-1] data-[highlighted]:before:rounded-sm data-[highlighted]:before:bg-gray-900"
              value="serif"
            >
              <Select.ItemIndicator className="col-start-1">
                <CheckIcon className="size-3" />
              </Select.ItemIndicator>
              <Select.ItemText className="col-start-2">Serif</Select.ItemText>
            </Select.Item>
            <Select.Item
              className="grid min-w-[var(--anchor-width)] cursor-default grid-cols-[0.75rem_1fr] items-center gap-2 py-2 pr-4 pl-2.5 text-sm leading-4 outline-none select-none group-data-[side=none]:min-w-[calc(var(--anchor-width)+1rem)] group-data-[side=none]:pr-12 group-data-[side=none]:text-base group-data-[side=none]:leading-4 data-[highlighted]:relative data-[highlighted]:z-0 data-[highlighted]:text-gray-50 data-[highlighted]:before:absolute data-[highlighted]:before:inset-x-1 data-[highlighted]:before:inset-y-0 data-[highlighted]:before:z-[-1] data-[highlighted]:before:rounded-sm data-[highlighted]:before:bg-gray-900"
              value="mono"
            >
              <Select.ItemIndicator className="col-start-1">
                <CheckIcon className="size-3" />
              </Select.ItemIndicator>
              <Select.ItemText className="col-start-2">
                Monospace
              </Select.ItemText>
            </Select.Item>
            <Select.Item
              className="grid min-w-[var(--anchor-width)] cursor-default grid-cols-[0.75rem_1fr] items-center gap-2 py-2 pr-4 pl-2.5 text-sm leading-4 outline-none select-none group-data-[side=none]:min-w-[calc(var(--anchor-width)+1rem)] group-data-[side=none]:pr-12 group-data-[side=none]:text-base group-data-[side=none]:leading-4 data-[highlighted]:relative data-[highlighted]:z-0 data-[highlighted]:text-gray-50 data-[highlighted]:before:absolute data-[highlighted]:before:inset-x-1 data-[highlighted]:before:inset-y-0 data-[highlighted]:before:z-[-1] data-[highlighted]:before:rounded-sm data-[highlighted]:before:bg-gray-900"
              value="cursive"
            >
              <Select.ItemIndicator className="col-start-1">
                <CheckIcon className="size-3" />
              </Select.ItemIndicator>
              <Select.ItemText className="col-start-2">Cursive</Select.ItemText>
            </Select.Item>
          </Select.Popup>
          <Select.ScrollDownArrow className="bottom-0 z-[1] flex h-4 w-full cursor-default items-center justify-center rounded-md bg-[canvas] text-center text-xs before:absolute before:top-[-100%] before:left-0 before:h-full before:w-full before:content-[''] data-[direction=down]:bottom-0 data-[direction=down]:before:bottom-[-100%]" />
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
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

function ChevronUpDownIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg
      width="8"
      height="12"
      viewBox="0 0 8 12"
      fill="none"
      stroke="currentcolor"
      strokeWidth="1.5"
      {...props}
    >
      <path d="M0.5 4.5L4 1.5L7.5 4.5" />
      <path d="M0.5 7.5L4 10.5L7.5 7.5" />
    </svg>
  );
}

function CheckIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg
      fill="currentcolor"
      width="10"
      height="10"
      viewBox="0 0 10 10"
      {...props}
    >
      <path d="M9.1603 1.12218C9.50684 1.34873 9.60427 1.81354 9.37792 2.16038L5.13603 8.66012C5.01614 8.8438 4.82192 8.96576 4.60451 8.99384C4.3871 9.02194 4.1683 8.95335 4.00574 8.80615L1.24664 6.30769C0.939709 6.02975 0.916013 5.55541 1.19372 5.24822C1.47142 4.94102 1.94536 4.91731 2.2523 5.19524L4.36085 7.10461L8.12299 1.33999C8.34934 0.993152 8.81376 0.895638 9.1603 1.12218Z" />
    </svg>
  );
}
```

## API reference

Import the component and assemble its parts:

```jsx title="Anatomy"
import { Select } from "@base-ui-components/react/select";

<Select.Root>
  <Select.Trigger>
    <Select.Value />
    <Select.Icon />
  </Select.Trigger>

  <Select.Portal>
    <Select.Backdrop />
    <Select.Positioner>
      <Select.ScrollUpArrow />
      <Select.Popup>
        <Select.Arrow />
        <Select.Item>
          <Select.ItemText />
          <Select.ItemIndicator />
        </Select.Item>
        <Select.Separator />
        <Select.Group>
          <Select.GroupLabel />
        </Select.Group>
      </Select.Popup>
      <Select.ScrollDownArrow />
    </Select.Positioner>
  </Select.Portal>
</Select.Root>;
```

### Root

Groups all parts of the select.
Doesn’t render its own HTML element.

**Root Props:**

| Prop                 | Type                             | Default | Description                                                                                                                    |
| :------------------- | :------------------------------- | :------ | :----------------------------------------------------------------------------------------------------------------------------- |
| name                 | `string`                         | -       | Identifies the field when a form is submitted.                                                                                 |
| defaultValue         | `any`                            | `null`  | The uncontrolled value of the select when it’s initially rendered.To render a controlled select, use the `value` prop instead. |
| value                | `any`                            | -       | The value of the select.                                                                                                       |
| onValueChange        | `(value, event) => void`         | -       | Callback fired when the value of the select changes. Use when controlled.                                                      |
| defaultOpen          | `boolean`                        | `false` | Whether the select menu is initially open.To render a controlled select menu, use the `open` prop instead.                     |
| open                 | `boolean`                        | -       | Whether the select menu is currently open.                                                                                     |
| onOpenChange         | `(open, event) => void`          | -       | Event handler called when the select menu is opened or closed.                                                                 |
| actionsRef           | `{ current: { unmount: func } }` | -       | A ref to imperative actions.                                                                                                   |
| alignItemToTrigger   | `boolean`                        | `true`  | Determines if the selected item inside the popup should align to the trigger element.                                          |
| modal                | `boolean`                        | `true`  | Whether the select should prevent outside clicks and lock page scroll when open.                                               |
| onOpenChangeComplete | `(open) => void`                 | -       | Event handler called after any animations complete when the select menu is opened or closed.                                   |
| disabled             | `boolean`                        | `false` | Whether the component should ignore user interaction.                                                                          |
| readOnly             | `boolean`                        | `false` | Whether the user should be unable to choose a different option from the select menu.                                           |
| required             | `boolean`                        | `false` | Whether the user must choose a value before submitting a form.                                                                 |

### Trigger

A button that opens the select menu.
Renders a `<div>` element.

**Trigger Props:**

| Prop      | Type                                                         | Default | Description                                                                                                                                                                                  |
| :-------- | :----------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| disabled  | `boolean`                                                    | `false` | Whether the component should ignore user interaction.                                                                                                                                        |
| className | `string \| (state) => string`                                | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render    | `React.ReactElement \| (props, state) => React.ReactElement` | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

**Trigger Data Attributes:**

| Attribute       | Type | Description                                                               |
| :-------------- | :--- | :------------------------------------------------------------------------ |
| data-popup-open | -    | Present when the corresponding select is open.                            |
| data-pressed    | -    | Present when the trigger is pressed.                                      |
| data-disabled   | -    | Present when the select is disabled.                                      |
| data-readonly   | -    | Present when the select is readonly.                                      |
| data-required   | -    | Present when the select is required.                                      |
| data-valid      | -    | Present when the select is in valid state (when wrapped in Field.Root).   |
| data-invalid    | -    | Present when the select is in invalid state (when wrapped in Field.Root). |
| data-dirty      | -    | Present when the select's value has changed (when wrapped in Field.Root). |
| data-touched    | -    | Present when the select has been touched (when wrapped in Field.Root).    |
| data-filled     | -    | Present when the select has a value (when wrapped in Field.Root).         |
| data-focused    | -    | Present when the select trigger is focused (when wrapped in Field.Root).  |

### Value

A text label of the currently selected item.
Renders a `<span>` element.

**Value Props:**

| Prop        | Type                                                         | Default | Description                                                                                                                                                                                  |
| :---------- | :----------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| placeholder | `string`                                                     | -       | A placeholder value to display when no value is selected.You can use this prop to pre-render the displayed text&#xA;during SSR in order to avoid the hydration flash.                        |
| children    | `React.ReactNode \| (value) => React.ReactNode`              | -       | Override children if you need to customize how the value is displayed.&#xA;By default, renders the current value as is.Accepts a `ReactNode` or a function that returns the node to render.  |
| className   | `string \| (state) => string`                                | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render      | `React.ReactElement \| (props, state) => React.ReactElement` | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

### Icon

An icon that indicates that the trigger button opens a select menu.
Renders a `<span>` element.

**Icon Props:**

| Prop      | Type                                                         | Default | Description                                                                                                                                                                                  |
| :-------- | :----------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| className | `string \| (state) => string`                                | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render    | `React.ReactElement \| (props, state) => React.ReactElement` | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

### Backdrop

An overlay displayed beneath the menu popup.
Renders a `<div>` element.

**Backdrop Props:**

| Prop      | Type                                                         | Default | Description                                                                                                                                                                                  |
| :-------- | :----------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| className | `string \| (state) => string`                                | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render    | `React.ReactElement \| (props, state) => React.ReactElement` | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

**Backdrop Data Attributes:**

| Attribute           | Type | Description                               |
| :------------------ | :--- | :---------------------------------------- |
| data-open           | -    | Present when the select is open.          |
| data-closed         | -    | Present when the select is closed.        |
| data-starting-style | -    | Present when the select is animating in.  |
| data-ending-style   | -    | Present when the select is animating out. |

### Portal

A portal element that moves the popup to a different part of the DOM.
By default, the portal element is appended to `<body>`.

**Portal Props:**

| Prop      | Type                               | Default | Description                                         |
| :-------- | :--------------------------------- | :------ | :-------------------------------------------------- |
| container | `React.Ref \| HTMLElement \| null` | -       | A parent element to render the portal element into. |

### Positioner

Positions the select menu popup against the trigger.
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

| Attribute          | Type                                                                                 | Description                                                            |
| :----------------- | :----------------------------------------------------------------------------------- | :--------------------------------------------------------------------- |
| data-open          | -                                                                                    | Present when the select popup is open.                                 |
| data-closed        | -                                                                                    | Present when the select popup is closed.                               |
| data-anchor-hidden | -                                                                                    | Present when the anchor is hidden.                                     |
| data-side          | `'none' \| 'top' \| 'bottom' \| 'left' \| 'right' \| 'inline-end' \| 'inline-start'` | Indicates which side the select is positioned relative to the trigger. |

**Positioner CSS Variables:**

| Variable           | Type     | Default | Description                                                                            |
| :----------------- | :------- | :------ | :------------------------------------------------------------------------------------- |
| --anchor-height    | `number` | -       | The anchor's height.                                                                   |
| --anchor-width     | `number` | -       | The anchor's width.                                                                    |
| --available-height | `number` | -       | The available height between the trigger and the edge of the viewport.                 |
| --available-width  | `number` | -       | The available width between the trigger and the edge of the viewport.                  |
| --transform-origin | `string` | -       | The coordinates that this element is anchored to. Used for animations and transitions. |

### Popup

A container for the select items.
Renders a `<div>` element.

**Popup Props:**

| Prop      | Type                                                         | Default | Description                                                                                                                                                                                  |
| :-------- | :----------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| className | `string \| (state) => string`                                | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render    | `React.ReactElement \| (props, state) => React.ReactElement` | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

**Popup Data Attributes:**

| Attribute           | Type                                                                                 | Description                                                            |
| :------------------ | :----------------------------------------------------------------------------------- | :--------------------------------------------------------------------- |
| data-open           | -                                                                                    | Present when the select is open.                                       |
| data-closed         | -                                                                                    | Present when the select is closed.                                     |
| data-side           | `'none' \| 'top' \| 'bottom' \| 'left' \| 'right' \| 'inline-end' \| 'inline-start'` | Indicates which side the select is positioned relative to the trigger. |
| data-starting-style | -                                                                                    | Present when the select is animating in.                               |
| data-ending-style   | -                                                                                    | Present when the select is animating out.                              |

### Arrow

Displays an element positioned against the select menu anchor.
Renders a `<div>` element.

**Arrow Props:**

| Prop      | Type                                                         | Default | Description                                                                                                                                                                                  |
| :-------- | :----------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| className | `string \| (state) => string`                                | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render    | `React.ReactElement \| (props, state) => React.ReactElement` | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

**Arrow Data Attributes:**

| Attribute          | Type                                                                                 | Description                                                            |
| :----------------- | :----------------------------------------------------------------------------------- | :--------------------------------------------------------------------- |
| data-open          | -                                                                                    | Present when the select popup is open.                                 |
| data-closed        | -                                                                                    | Present when the select popup is closed.                               |
| data-uncentered    | -                                                                                    | Present when the select arrow is uncentered.                           |
| data-anchor-hidden | -                                                                                    | Present when the anchor is hidden.                                     |
| data-side          | `'none' \| 'top' \| 'bottom' \| 'left' \| 'right' \| 'inline-end' \| 'inline-start'` | Indicates which side the select is positioned relative to the trigger. |

### Item

An individual option in the select menu.
Renders a `<div>` element.

**Item Props:**

| Prop      | Type                                                         | Default | Description                                                                                                                                                                                  |
| :-------- | :----------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| label     | `string`                                                     | -       | Overrides the text label to use on the trigger when this item is selected&#xA;and when the item is matched during keyboard text navigation.                                                  |
| value     | `any`                                                        | `null`  | A unique value that identifies this select item.                                                                                                                                             |
| disabled  | `boolean`                                                    | `false` | Whether the component should ignore user interaction.                                                                                                                                        |
| className | `string \| (state) => string`                                | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render    | `React.ReactElement \| (props, state) => React.ReactElement` | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

### ItemText

A text label of the select item.
Renders a `<div>` element.

**ItemText Props:**

| Prop      | Type                                                         | Default | Description                                                                                                                                                                                  |
| :-------- | :----------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| className | `string \| (state) => string`                                | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render    | `React.ReactElement \| (props, state) => React.ReactElement` | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

### ItemIndicator

Indicates whether the select item is selected.
Renders a `<span>` element.

**ItemIndicator Props:**

| Prop        | Type                                                         | Default | Description                                                                                                                                                                                  |
| :---------- | :----------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| className   | `string \| (state) => string`                                | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| keepMounted | `boolean`                                                    | `false` | Whether to keep the HTML element in the DOM when the item is not selected.                                                                                                                   |
| render      | `React.ReactElement \| (props, state) => React.ReactElement` | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

### Group

Groups related select items with the corresponding label.
Renders a `<div>` element.

**Group Props:**

| Prop      | Type                                                         | Default | Description                                                                                                                                                                                  |
| :-------- | :----------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| className | `string \| (state) => string`                                | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render    | `React.ReactElement \| (props, state) => React.ReactElement` | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

### GroupLabel

An accessible label that is automatically associated with its parent group.
Renders a `<div>` element.

**GroupLabel Props:**

| Prop      | Type                                                         | Default | Description                                                                                                                                                                                  |
| :-------- | :----------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| className | `string \| (state) => string`                                | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render    | `React.ReactElement \| (props, state) => React.ReactElement` | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

### ScrollUpArrow

An element that scrolls the select menu down when hovered.
Renders a `<div>` element.

**ScrollUpArrow Props:**

| Prop        | Type                                                         | Default | Description                                                                                                                                                                                  |
| :---------- | :----------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| className   | `string \| (state) => string`                                | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| keepMounted | `boolean`                                                    | `false` | Whether to keep the HTML element in the DOM while the select menu is not scrollable.                                                                                                         |
| render      | `React.ReactElement \| (props, state) => React.ReactElement` | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

**ScrollUpArrow Data Attributes:**

| Attribute      | Type                                                                                 | Description                                                          |
| :------------- | :----------------------------------------------------------------------------------- | :------------------------------------------------------------------- |
| data-direction | `'up'`                                                                               | Indicates the direction of the arrow.                                |
| data-side      | `'none' \| 'top' \| 'bottom' \| 'left' \| 'right' \| 'inline-end' \| 'inline-start'` | Indicates which side the arrow is positioned relative to the select. |
| data-visible   | -                                                                                    | Present when the arrow is visible.                                   |

### ScrollDownArrow

An element that scrolls the select menu down when hovered.
Renders a `<div>` element.

**ScrollDownArrow Props:**

| Prop        | Type                                                         | Default | Description                                                                                                                                                                                  |
| :---------- | :----------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| className   | `string \| (state) => string`                                | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| keepMounted | `boolean`                                                    | `false` | Whether to keep the HTML element in the DOM while the select menu is not scrollable.                                                                                                         |
| render      | `React.ReactElement \| (props, state) => React.ReactElement` | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

**ScrollDownArrow Data Attributes:**

| Attribute      | Type                                                                                 | Description                                                          |
| :------------- | :----------------------------------------------------------------------------------- | :------------------------------------------------------------------- |
| data-direction | `'down'`                                                                             | Indicates the direction of the arrow.                                |
| data-side      | `'none' \| 'top' \| 'bottom' \| 'left' \| 'right' \| 'inline-end' \| 'inline-start'` | Indicates which side the arrow is positioned relative to the select. |
| data-visible   | -                                                                                    | Present when the arrow is visible.                                   |

### Separator

A separator element accessible to screen readers.
Renders a `<div>` element.

**Separator Props:**

| Prop        | Type                                                         | Default        | Description                                                                                                                                                                                  |
| :---------- | :----------------------------------------------------------- | :------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| orientation | `'horizontal' \| 'vertical'`                                 | `'horizontal'` | The orientation of the separator.                                                                                                                                                            |
| className   | `string \| (state) => string`                                | -              | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render      | `React.ReactElement \| (props, state) => React.ReactElement` | -              | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |
