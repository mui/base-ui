---
title: Toggle Group
subtitle: Provides a shared state to a series of toggle buttons.
description: A high-quality, unstyled React toggle group component that provides shared state to a series of toggle buttons.
---

# Toggle Group

A high-quality, unstyled React toggle group component that provides shared state to a series of toggle buttons.

## Demo

### CSS Modules

This example shows how to implement the component using CSS Modules.

```css
/* index.module.css */
.Panel {
  display: flex;
  gap: 1px;
  border: 1px solid var(--color-gray-200);
  background-color: var(--color-gray-50);
  border-radius: 0.375rem;
  padding: 0.125rem;
}

.Button {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  padding: 0;
  margin: 0;
  outline: 0;
  border: 0;
  border-radius: 0.25rem;
  background-color: transparent;
  color: var(--color-gray-600);
  user-select: none;

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
}

.Icon {
  width: 1rem;
  height: 1rem;
}
```

```tsx
/* index.tsx */
import * as React from 'react';
import { Toggle } from '@base-ui-components/react/toggle';
import { ToggleGroup } from '@base-ui-components/react/toggle-group';
import styles from './index.module.css';

export default function ExampleToggleGroup() {
  return (
    <ToggleGroup defaultValue={['left']} className={styles.Panel}>
      <Toggle aria-label="Align left" value="left" className={styles.Button}>
        <AlignLeftIcon className={styles.Icon} />
      </Toggle>
      <Toggle aria-label="Align center" value="center" className={styles.Button}>
        <AlignCenterIcon className={styles.Icon} />
      </Toggle>
      <Toggle aria-label="Align right" value="right" className={styles.Button}>
        <AlignRightIcon className={styles.Icon} />
      </Toggle>
    </ToggleGroup>
  );
}

function AlignLeftIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      stroke="currentcolor"
      strokeLinecap="round"
      {...props}
    >
      <path d="M2.5 3.5H13.5" />
      <path d="M2.5 9.5H13.5" />
      <path d="M2.5 6.5H10.5" />
      <path d="M2.5 12.5H10.5" />
    </svg>
  );
}

function AlignCenterIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      stroke="currentcolor"
      strokeLinecap="round"
      {...props}
    >
      <path d="M3 3.5H14" />
      <path d="M3 9.5H14" />
      <path d="M4.5 6.5H12.5" />
      <path d="M4.5 12.5H12.5" />
    </svg>
  );
}

function AlignRightIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      stroke="currentcolor"
      strokeLinecap="round"
      {...props}
    >
      <path d="M2.5 3.5H13.5" />
      <path d="M2.5 9.5H13.5" />
      <path d="M5.5 6.5H13.5" />
      <path d="M5.5 12.5H13.5" />
    </svg>
  );
}
```

### Tailwind

This example shows how to implement the component using Tailwind CSS.

```tsx
/* index.tsx */
import * as React from 'react';
import { Toggle } from '@base-ui-components/react/toggle';
import { ToggleGroup } from '@base-ui-components/react/toggle-group';

export default function ExampleToggleGroup() {
  return (
    <ToggleGroup
      defaultValue={['left']}
      className="flex gap-px rounded-md border border-gray-200 bg-gray-50 p-0.5"
    >
      <Toggle
        aria-label="Align left"
        value="left"
        className="flex size-8 items-center justify-center rounded-sm text-gray-600 select-none hover:bg-gray-100 focus-visible:bg-none focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-200 data-[pressed]:bg-gray-100 data-[pressed]:text-gray-900"
      >
        <AlignLeftIcon className="size-4" />
      </Toggle>
      <Toggle
        aria-label="Align center"
        value="center"
        className="flex size-8 items-center justify-center rounded-sm text-gray-600 select-none hover:bg-gray-100 focus-visible:bg-none focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-200 data-[pressed]:bg-gray-100 data-[pressed]:text-gray-900"
      >
        <AlignCenterIcon className="size-4" />
      </Toggle>
      <Toggle
        aria-label="Align right"
        value="right"
        className="flex size-8 items-center justify-center rounded-sm text-gray-600 select-none hover:bg-gray-100 focus-visible:bg-none focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-200 data-[pressed]:bg-gray-100 data-[pressed]:text-gray-900"
      >
        <AlignRightIcon className="size-4" />
      </Toggle>
    </ToggleGroup>
  );
}

function AlignLeftIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      stroke="currentcolor"
      strokeLinecap="round"
      {...props}
    >
      <path d="M2.5 3.5H13.5" />
      <path d="M2.5 9.5H13.5" />
      <path d="M2.5 6.5H10.5" />
      <path d="M2.5 12.5H10.5" />
    </svg>
  );
}

function AlignCenterIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      stroke="currentcolor"
      strokeLinecap="round"
      {...props}
    >
      <path d="M3 3.5H14" />
      <path d="M3 9.5H14" />
      <path d="M4.5 6.5H12.5" />
      <path d="M4.5 12.5H12.5" />
    </svg>
  );
}

function AlignRightIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      stroke="currentcolor"
      strokeLinecap="round"
      {...props}
    >
      <path d="M2.5 3.5H13.5" />
      <path d="M2.5 9.5H13.5" />
      <path d="M5.5 6.5H13.5" />
      <path d="M5.5 12.5H13.5" />
    </svg>
  );
}
```

## API reference

Import the component and use it as a single part:

```jsx title="Anatomy"
import { ToggleGroup } from '@base-ui-components/react/toggle-group';

<ToggleGroup />;
```

Provides a shared state to a series of toggle buttons.

**ToggleGroup Props:**

| Prop           | Type                                                                        | Default        | Description                                                                                                                                                                                  |
| :------------- | :-------------------------------------------------------------------------- | :------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| defaultValue   | `any[]`                                                                     | -              | The open state of the ToggleGroup represented by an array of&#xA;the values of all pressed `<ToggleGroup.Item/>`s.&#xA;This is the uncontrolled counterpart of `value`.                      |
| value          | `any[]`                                                                     | -              | The open state of the ToggleGroup represented by an array of&#xA;the values of all pressed `<ToggleGroup.Item/>`s&#xA;This is the controlled counterpart of `defaultValue`.                  |
| onValueChange  | `((groupValue: any[], event: Event) => void)`                               | -              | Callback fired when the pressed states of the ToggleGroup changes.                                                                                                                           |
| toggleMultiple | `boolean`                                                                   | `false`        | When `false` only one item in the group can be pressed. If any item in&#xA;the group becomes pressed, the others will become unpressed.&#xA;When `true` multiple items can be pressed.       |
| disabled       | `boolean`                                                                   | `false`        | Whether the component should ignore user interaction.                                                                                                                                        |
| loop           | `boolean`                                                                   | `true`         | Whether to loop keyboard focus back to the first item&#xA;when the end of the list is reached while using the arrow keys.                                                                    |
| orientation    | `ToggleGroupOrientation`                                                    | `'horizontal'` | -                                                                                                                                                                                            |
| className      | `string \| ((state: State) => string)`                                      | -              | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render         | `ReactElement \| ((props: GenericHTMLProps, state: State) => ReactElement)` | -              | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

**ToggleGroup Data Attributes:**

| Attribute        | Type                         | Description                                                                                        |
| :--------------- | :--------------------------- | :------------------------------------------------------------------------------------------------- |
| data-orientation | `'horizontal' \| 'vertical'` | Indicates the orientation of the toggle group.                                                     |
| data-disabled    | -                            | Present when the toggle group is disabled.                                                         |
| data-multiple    | -                            | Present when the toggle group allows multiple buttons to be in the pressed state at the same time. |
