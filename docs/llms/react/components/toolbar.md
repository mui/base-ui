---
title: Toolbar
subtitle: A container for grouping a set of buttons and controls.
description: A high-quality, unstyled React toolbar component that groups a set of buttons and controls.
---

# Toolbar

A high-quality, unstyled React toolbar component that groups a set of buttons and controls.

## Demo

### CSS Modules

This example shows how to implement the component using CSS Modules.

```css
/* index.module.css */
.Toolbar {
  display: flex;
  align-items: center;
  gap: 1px;
  border: 1px solid var(--color-gray-200);
  background-color: var(--color-gray-50);
  border-radius: 0.375rem;
  padding: 0.125rem;
  width: 37.5rem;
}

.Group {
  display: flex;
  gap: 0.25rem;
}

.Button {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 2rem;
  height: 2rem;
  padding: 0;
  margin: 0;
  outline: 0;
  border: 0;
  border-radius: 0.25rem;
  background-color: transparent;
  color: var(--color-gray-600);
  user-select: none;
  font-family: inherit;
  font-size: 0.875rem;
  font-weight: 500;

  &:focus-visible {
    background-color: transparent;
    outline: 2px solid var(--color-blue);
    outline-offset: -1px;
  }

  @media (hover: hover) {
    &:hover {
      background-color: var(--color-gray-100);
    }
  }

  &:active {
    background-color: var(--color-gray-200);
  }

  &[data-pressed] {
    background-color: var(--color-gray-100);
    color: var(--color-gray-900);
  }

  &[aria-pressed] {
    padding: 0 0.75rem;
  }

  &[role='combobox'] {
    min-width: 8rem;
    justify-content: space-between;
    padding: 0 0.75rem;
  }
}

.Separator {
  width: 1px;
  height: 16px;
  margin: 0.25rem;
  background-color: var(--color-gray-300);
}

.Link {
  color: var(--color-gray-500);
  font-family: inherit;
  font-size: 0.875rem;
  text-decoration: none;
  align-self: center;
  flex: 0 0 auto;
  margin-inline: auto 0.875rem;

  &:focus-visible {
    outline: 2px solid var(--color-blue);
    outline-offset: -2px;
    border-radius: var(--radius-sm);
  }

  @media (hover: hover) {
    &:hover {
      color: var(--color-blue);
    }
  }
}

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

  &[data-starting-style],
  &[data-ending-style] {
    opacity: 0;
    transform: scale(0.9);
  }

  &[data-side='none'] {
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

  &[data-side='top'] {
    bottom: -8px;
    rotate: 180deg;
  }

  &[data-side='bottom'] {
    top: -8px;
    rotate: 0deg;
  }

  &[data-side='left'] {
    right: -13px;
    rotate: 90deg;
  }

  &[data-side='right'] {
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

  [data-side='none'] & {
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
    content: '';
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
```

```tsx
/* index.tsx */
import * as React from 'react';
import { Toolbar } from '@base-ui-components/react/toolbar';
import { ToggleGroup } from '@base-ui-components/react/toggle-group';
import { Toggle } from '@base-ui-components/react/toggle';
import { Select } from '@base-ui-components/react/select';
import styles from './index.module.css';

export default function ExampleToolbar() {
  return (
    <Toolbar.Root className={styles.Toolbar}>
      <ToggleGroup className={styles.Group} aria-label="Alignment">
        <Toolbar.Button
          render={<Toggle />}
          aria-label="Align left"
          value="align-left"
          className={styles.Button}
        >
          Align Left
        </Toolbar.Button>
        <Toolbar.Button
          render={<Toggle />}
          aria-label="Align right"
          value="align-right"
          className={styles.Button}
        >
          Align Right
        </Toolbar.Button>
      </ToggleGroup>
      <Toolbar.Separator className={styles.Separator} />
      <Toolbar.Group className={styles.Group} aria-label="Numerical format">
        <Toolbar.Button className={styles.Button} aria-label="Format as currency">
          $
        </Toolbar.Button>
        <Toolbar.Button className={styles.Button} aria-label="Format as percent">
          %
        </Toolbar.Button>
      </Toolbar.Group>
      <Toolbar.Separator className={styles.Separator} />
      <Select.Root defaultValue="helvetica">
        <Toolbar.Button render={<Select.Trigger />} className={styles.Button}>
          <Select.Value placeholder="Helvetica" />
          <Select.Icon>
            <ChevronUpDownIcon />
          </Select.Icon>
        </Toolbar.Button>
        <Select.Portal>
          <Select.Positioner className={styles.Positioner} sideOffset={8}>
            <Select.Popup className={styles.Popup}>
              <Select.Arrow className={styles.Arrow}>
                <ArrowSvg />
              </Select.Arrow>
              <Select.Item className={styles.Item} value="helvetica">
                <Select.ItemIndicator className={styles.ItemIndicator}>
                  <CheckIcon className={styles.ItemIndicatorIcon} />
                </Select.ItemIndicator>
                <Select.ItemText className={styles.ItemText}>
                  Helvetica
                </Select.ItemText>
              </Select.Item>
              <Select.Item className={styles.Item} value="arial">
                <Select.ItemIndicator className={styles.ItemIndicator}>
                  <CheckIcon className={styles.ItemIndicatorIcon} />
                </Select.ItemIndicator>
                <Select.ItemText className={styles.ItemText}>Arial</Select.ItemText>
              </Select.Item>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
      <Toolbar.Separator className={styles.Separator} />
      <Toolbar.Link className={styles.Link} href="#">
        Edited 51m ago
      </Toolbar.Link>
    </Toolbar.Root>
  );
}

function ArrowSvg(props: React.ComponentProps<'svg'>) {
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

function ChevronUpDownIcon(props: React.ComponentProps<'svg'>) {
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

function CheckIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg fill="currentcolor" width="10" height="10" viewBox="0 0 10 10" {...props}>
      <path d="M9.1603 1.12218C9.50684 1.34873 9.60427 1.81354 9.37792 2.16038L5.13603 8.66012C5.01614 8.8438 4.82192 8.96576 4.60451 8.99384C4.3871 9.02194 4.1683 8.95335 4.00574 8.80615L1.24664 6.30769C0.939709 6.02975 0.916013 5.55541 1.19372 5.24822C1.47142 4.94102 1.94536 4.91731 2.2523 5.19524L4.36085 7.10461L8.12299 1.33999C8.34934 0.993152 8.81376 0.895638 9.1603 1.12218Z" />
    </svg>
  );
}
```

### Tailwind

This example shows how to implement the component using Tailwind CSS.

```tsx
/* index.tsx */
import * as React from 'react';
import { Toolbar } from '@base-ui-components/react/toolbar';
import { ToggleGroup } from '@base-ui-components/react/toggle-group';
import { Toggle } from '@base-ui-components/react/toggle';
import { Select } from '@base-ui-components/react/select';

export default function ExampleToolbar() {
  return (
    <Toolbar.Root className="flex w-150 items-center gap-px rounded-md border border-gray-200 bg-gray-50 p-0.5">
      <ToggleGroup className="flex gap-1" aria-label="Alignment">
        <Toolbar.Button
          render={<Toggle />}
          aria-label="Align left"
          value="align-left"
          className="flex h-8 items-center justify-center rounded-sm px-[0.75rem] font-[inherit] text-sm font-medium text-gray-600 select-none hover:bg-gray-100 focus-visible:bg-none focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-200 data-[pressed]:bg-gray-100 data-[pressed]:text-gray-900"
        >
          Align Left
        </Toolbar.Button>
        <Toolbar.Button
          render={<Toggle />}
          aria-label="Align right"
          value="align-right"
          className="flex h-8 items-center justify-center rounded-sm px-[0.75rem] font-[inherit] text-sm font-medium text-gray-600 select-none hover:bg-gray-100 focus-visible:bg-none focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-200 data-[pressed]:bg-gray-100 data-[pressed]:text-gray-900"
        >
          Align Right
        </Toolbar.Button>
      </ToggleGroup>
      <Toolbar.Separator className="m-1 h-4 w-px bg-gray-300" />
      <Toolbar.Group className="flex gap-1" aria-label="Numerical format">
        <Toolbar.Button
          className="flex size-8 items-center justify-center rounded-sm px-[0.75rem] font-[inherit] text-sm font-medium text-gray-600 select-none hover:bg-gray-100 focus-visible:bg-none focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-200 data-[pressed]:bg-gray-100 data-[pressed]:text-gray-900"
          aria-label="Format as currency"
        >
          $
        </Toolbar.Button>
        <Toolbar.Button
          className="flex size-8 items-center justify-center rounded-sm px-[0.75rem] font-[inherit] text-sm font-medium text-gray-600 select-none hover:bg-gray-100 focus-visible:bg-none focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-200 data-[pressed]:bg-gray-100 data-[pressed]:text-gray-900"
          aria-label="Format as percent"
        >
          %
        </Toolbar.Button>
      </Toolbar.Group>
      <Toolbar.Separator className="m-1 h-4 w-px bg-gray-300" />
      <Select.Root defaultValue="helvetica">
        <Toolbar.Button
          render={<Select.Trigger />}
          className="flex h-8 min-w-32 items-center justify-between rounded-sm px-[0.75rem] font-[inherit] text-sm font-medium text-gray-600 select-none hover:bg-gray-100 focus-visible:bg-none focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-200 data-[pressed]:bg-gray-100 data-[pressed]:text-gray-900"
        >
          <Select.Value placeholder="Helvetica" />
          <Select.Icon>
            <ChevronUpDownIcon />
          </Select.Icon>
        </Toolbar.Button>
        <Select.Portal>
          <Select.Positioner className="outline-none" sideOffset={8}>
            <Select.Popup className="group origin-[var(--transform-origin)] rounded-md bg-[canvas] py-1 text-gray-900 shadow-lg shadow-gray-200 outline outline-1 outline-gray-200 transition-[transform,scale,opacity] data-[ending-style]:scale-90 data-[ending-style]:scale-100 data-[ending-style]:opacity-0 data-[ending-style]:opacity-100 data-[ending-style]:transition-none data-[starting-style]:scale-90 data-[starting-style]:opacity-0 data-[side=none]:data-[starting-style]:scale-100 data-[side=none]:data-[starting-style]:opacity-100 data-[side=none]:data-[starting-style]:transition-none dark:shadow-none dark:-outline-offset-1 dark:outline-gray-300">
              <Select.Arrow className="data-[side=bottom]:top-[-8px] data-[side=left]:right-[-13px] data-[side=left]:rotate-90 data-[side=right]:left-[-13px] data-[side=right]:-rotate-90 data-[side=top]:bottom-[-8px] data-[side=top]:rotate-180">
                <ArrowSvg />
              </Select.Arrow>
              <Select.Item
                className="grid min-w-[var(--anchor-width)] cursor-default grid-cols-[0.75rem_1fr] items-center gap-2 py-2 pr-4 pl-2.5 text-sm leading-4 outline-none select-none group-data-[side=none]:min-w-[calc(var(--anchor-width)+1rem)] group-data-[side=none]:pr-12 group-data-[side=none]:text-base group-data-[side=none]:leading-4 data-[highlighted]:relative data-[highlighted]:z-0 data-[highlighted]:text-gray-50 data-[highlighted]:before:absolute data-[highlighted]:before:inset-x-1 data-[highlighted]:before:inset-y-0 data-[highlighted]:before:z-[-1] data-[highlighted]:before:rounded-sm data-[highlighted]:before:bg-gray-900"
                value="helvetica"
              >
                <Select.ItemIndicator className="col-start-1">
                  <CheckIcon className="size-3" />
                </Select.ItemIndicator>
                <Select.ItemText className="col-start-2">Helvetica</Select.ItemText>
              </Select.Item>
              <Select.Item
                className="grid min-w-[var(--anchor-width)] cursor-default grid-cols-[0.75rem_1fr] items-center gap-2 py-2 pr-4 pl-2.5 text-sm leading-4 outline-none select-none group-data-[side=none]:min-w-[calc(var(--anchor-width)+1rem)] group-data-[side=none]:pr-12 group-data-[side=none]:text-base group-data-[side=none]:leading-4 data-[highlighted]:relative data-[highlighted]:z-0 data-[highlighted]:text-gray-50 data-[highlighted]:before:absolute data-[highlighted]:before:inset-x-1 data-[highlighted]:before:inset-y-0 data-[highlighted]:before:z-[-1] data-[highlighted]:before:rounded-sm data-[highlighted]:before:bg-gray-900"
                value="arial"
              >
                <Select.ItemIndicator className="col-start-1">
                  <CheckIcon className="size-3" />
                </Select.ItemIndicator>
                <Select.ItemText className="col-start-2">Arial</Select.ItemText>
              </Select.Item>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
      <Toolbar.Separator className="m-1 h-4 w-px bg-gray-300" />
      <Toolbar.Link
        className="mr-[0.875rem] ml-auto flex-none self-center text-sm text-gray-500 no-underline hover:text-blue-800 focus-visible:rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-800"
        href="#"
      >
        Edited 51m ago
      </Toolbar.Link>
    </Toolbar.Root>
  );
}

function ArrowSvg(props: React.ComponentProps<'svg'>) {
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

function ChevronUpDownIcon(props: React.ComponentProps<'svg'>) {
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

function CheckIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg fill="currentcolor" width="10" height="10" viewBox="0 0 10 10" {...props}>
      <path d="M9.1603 1.12218C9.50684 1.34873 9.60427 1.81354 9.37792 2.16038L5.13603 8.66012C5.01614 8.8438 4.82192 8.96576 4.60451 8.99384C4.3871 9.02194 4.1683 8.95335 4.00574 8.80615L1.24664 6.30769C0.939709 6.02975 0.916013 5.55541 1.19372 5.24822C1.47142 4.94102 1.94536 4.91731 2.2523 5.19524L4.36085 7.10461L8.12299 1.33999C8.34934 0.993152 8.81376 0.895638 9.1603 1.12218Z" />
    </svg>
  );
}
```

## Accessibility guidelines

To ensure that toolbars are accessible and helpful, follow these guidelines:

- **Use inputs sparingly**: Left and right arrow keys are used to both move the text insertion cursor in an input, and to navigate among controls in horizontal toolbars. When using an input in a horizontal toolbar, use only one and place it as the last element of the toolbar.

## API reference

Import the component and assemble its parts:

```jsx title="Anatomy"
import { Toolbar } from '@base-ui-components/react/toolbar';

<Toolbar.Root>
  <Toolbar.Button />
  <Toolbar.Link />
  <Toolbar.Separator />
  <Toolbar.Group>
    <Toolbar.Button />
    <Toolbar.Button />
  <Toolbar.Group />
  <Toolbar.Input />
</Toolbar.Root>;
```

### Root

A container for grouping a set of controls, such as buttons, toggle groups, or menus.
Renders a `<div>` element.

**Root Props:**

| Prop        | Type                                                                        | Default        | Description                                                                                                                                                                                  |
| :---------- | :-------------------------------------------------------------------------- | :------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| cols        | `number`                                                                    | `1`            | The number of columns. When greater than 1, the toolbar is arranged into&#xA;a grid.                                                                                                         |
| disabled    | `boolean`                                                                   | -              | -                                                                                                                                                                                            |
| loop        | `boolean`                                                                   | `true`         | If `true`, using keyboard navigation will wrap focus to the other end of the toolbar once the end is reached.                                                                                |
| orientation | `Orientation`                                                               | `'horizontal'` | The orientation of the toolbar.                                                                                                                                                              |
| className   | `string \| ((state: State) => string)`                                      | -              | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render      | `ReactElement \| ((props: GenericHTMLProps, state: State) => ReactElement)` | -              | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

**Root Data Attributes:**

| Attribute        | Type                         | Description                               |
| :--------------- | :--------------------------- | :---------------------------------------- |
| data-orientation | `'horizontal' \| 'vertical'` | Indicates the orientation of the toolbar. |
| data-disabled    | -                            | Present when the toolbar is disabled.     |

### Button

A button that can be used as-is or as a trigger for other components.
Renders a `<button>` element.

**Button Props:**

| Prop                  | Type                                                                        | Default | Description                                                                                                                                                                                  |
| :-------------------- | :-------------------------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| focusableWhenDisabled | `boolean`                                                                   | `true`  | When `true` the item remains focuseable when disabled.                                                                                                                                       |
| disabled              | `boolean`                                                                   | `false` | When `true` the item is disabled.                                                                                                                                                            |
| className             | `string \| ((state: State) => string)`                                      | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render                | `ReactElement \| ((props: GenericHTMLProps, state: State) => ReactElement)` | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

**Button Data Attributes:**

| Attribute        | Type                         | Description                                                |
| :--------------- | :--------------------------- | :--------------------------------------------------------- |
| data-highlighted | -                            | Present when the button is the active item in the toolbar. |
| data-orientation | `'horizontal' \| 'vertical'` | Indicates the orientation of the toolbar.                  |
| data-disabled    | -                            | Present when the button is disabled.                       |
| data-focusable   | -                            | Present when the button remains focusable when disabled.   |

### Link

A link component.
Renders an `<a>` element.

**Link Props:**

| Prop      | Type                                                                        | Default | Description                                                                                                                                                                                  |
| :-------- | :-------------------------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| className | `string \| ((state: State) => string)`                                      | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render    | `ReactElement \| ((props: GenericHTMLProps, state: State) => ReactElement)` | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

**Link Data Attributes:**

| Attribute        | Type                         | Description                                              |
| :--------------- | :--------------------------- | :------------------------------------------------------- |
| data-highlighted | -                            | Present when the link is the active item in the toolbar. |
| data-orientation | `'horizontal' \| 'vertical'` | Indicates the orientation of the toolbar.                |

### Input

A native input element that integrates with Toolbar keyboard navigation.
Renders an `<input>` element.

**Input Props:**

| Prop                  | Type                                                                        | Default | Description                                                                                                                                                                                  |
| :-------------------- | :-------------------------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| defaultValue          | `string \| number \| string[]`                                              | -       | -                                                                                                                                                                                            |
| focusableWhenDisabled | `boolean`                                                                   | `true`  | When `true` the item remains focuseable when disabled.                                                                                                                                       |
| disabled              | `boolean`                                                                   | `false` | When `true` the item is disabled.                                                                                                                                                            |
| className             | `string \| ((state: State) => string)`                                      | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render                | `ReactElement \| ((props: GenericHTMLProps, state: State) => ReactElement)` | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

**Input Data Attributes:**

| Attribute        | Type                         | Description                                               |
| :--------------- | :--------------------------- | :-------------------------------------------------------- |
| data-highlighted | -                            | Present when the input is the active item in the toolbar. |
| data-orientation | `'horizontal' \| 'vertical'` | Indicates the orientation of the toolbar.                 |
| data-disabled    | -                            | Present when the input is disabled.                       |
| data-focusable   | -                            | Present when the input remains focusable when disabled.   |

### Group

Groups several toolbar items or toggles.
Renders a `<div>` element.

**Group Props:**

| Prop      | Type                                                                        | Default | Description                                                                                                                                                                                  |
| :-------- | :-------------------------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| disabled  | `boolean`                                                                   | `false` | When `true` all toolbar items in the group are disabled.                                                                                                                                     |
| className | `string \| ((state: State) => string)`                                      | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render    | `ReactElement \| ((props: GenericHTMLProps, state: State) => ReactElement)` | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

**Group Data Attributes:**

| Attribute        | Type                         | Description                               |
| :--------------- | :--------------------------- | :---------------------------------------- |
| data-orientation | `'horizontal' \| 'vertical'` | Indicates the orientation of the toolbar. |
| data-disabled    | -                            | Present when the group is disabled.       |

### Separator

A separator element accessible to screen readers.
Renders a `<div>` element.

**Separator Props:**

| Prop        | Type                                                                        | Default        | Description                                                                                                                                                                                  |
| :---------- | :-------------------------------------------------------------------------- | :------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| orientation | `Orientation`                                                               | `'horizontal'` | The orientation of the separator.                                                                                                                                                            |
| className   | `string \| ((state: State) => string)`                                      | -              | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render      | `ReactElement \| ((props: GenericHTMLProps, state: State) => ReactElement)` | -              | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

**Separator Data Attributes:**

| Attribute        | Type                         | Description                               |
| :--------------- | :--------------------------- | :---------------------------------------- |
| data-orientation | `'horizontal' \| 'vertical'` | Indicates the orientation of the toolbar. |

## Examples

### Using with Menu

All Base UI popup components that provide a `Trigger` component can be integrated with a toolbar by passing the trigger to `Toolbar.Button` with the `render` prop:

```tsx {4,12} title="Using popups with toolbar"
return (
  <Toolbar.Root>
    <Menu.Root>
      <Toolbar.Button render={<Menu.Trigger />} />
      <Menu.Portal>
        {/* prettier-ignore */}
        {/* Compose the rest of the menu */}
      </Menu.Portal>
    </Menu.Root>
  </Toolbar.Root>;
)
```

This applies to `AlertDialog`, `Dialog`, `Menu`, `Popover` and `Select`.

### Using with Tooltip

Unlike other popups, the toolbar item should be passed to the `render` prop of `Tooltip.Trigger`:

```tsx {4} title="Using popups with toolbar"
return (
  <Toolbar.Root>
    <Tooltip.Root>
      <Tooltip.Trigger render={<Toolbar.Button />} />
      <Tooltip.Portal>
        {/* prettier-ignore */}
        {/* Compose the rest of the tooltip */}
      </Tooltip.Portal>
    </Tooltip.Root>
  </Toolbar.Root>;
)
```

### Using with NumberField

To use a NumberField in the toolbar, pass `NumberField.Input` to `Toolbar.Input` using the `render` prop:

```tsx {6} title="Using NumberField with toolbar"
return (
  <Toolbar.Root>
    <NumberField.Root>
      <NumberField.Group>
        <NumberField.Decrement />
        <Toolbar.Input render={<NumberField.Input />} />
        <NumberField.Increment />
      </NumberField.Group>
    </NumberField.Root>
  </Toolbar.Root>;
)
```
