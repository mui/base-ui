---
title: Checkbox
subtitle: An easily stylable checkbox component.
description: A high-quality, unstyled React checkbox component that is easy to customize.
---

# Checkbox

A high-quality, unstyled React checkbox component that is easy to customize.

## Demo

### CSS Modules

This example shows how to implement the component using CSS Modules.

```css
/* index.module.css */
.Label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  line-height: 1.5rem;
  color: var(--color-gray-900);
}

.Checkbox {
  box-sizing: border-box;
  display: flex;
  width: 1.25rem;
  height: 1.25rem;
  align-items: center;
  justify-content: center;
  border-radius: 0.25rem;
  outline: 0;
  padding: 0;
  margin: 0;
  border: none;

  &[data-unchecked] {
    border: 1px solid var(--color-gray-300);
    background-color: transparent;
  }

  &[data-checked] {
    background-color: var(--color-gray-900);
  }

  &:focus-visible {
    outline: 2px solid var(--color-blue);
    outline-offset: 2px;
  }
}

.Indicator {
  display: flex;
  color: var(--color-gray-50);

  &[data-unchecked] {
    display: none;
  }
}

.Icon {
  width: 0.75rem;
  height: 0.75rem;
}
```

```tsx
/* index.tsx */
import * as React from 'react';
import { Checkbox } from '@base-ui-components/react/checkbox';
import styles from './index.module.css';

export default function ExampleCheckbox() {
  return (
    <label className={styles.Label}>
      <Checkbox.Root defaultChecked className={styles.Checkbox}>
        <Checkbox.Indicator className={styles.Indicator}>
          <CheckIcon className={styles.Icon} />
        </Checkbox.Indicator>
      </Checkbox.Root>
      Enable notifications
    </label>
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
import { Checkbox } from '@base-ui-components/react/checkbox';

export default function ExampleCheckbox() {
  return (
    <label className="flex items-center gap-2 text-base text-gray-900">
      <Checkbox.Root
        defaultChecked
        className="flex size-5 items-center justify-center rounded-sm outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800 data-[checked]:bg-gray-900 data-[unchecked]:border data-[unchecked]:border-gray-300"
      >
        <Checkbox.Indicator className="flex text-gray-50 data-[unchecked]:hidden">
          <CheckIcon className="size-3" />
        </Checkbox.Indicator>
      </Checkbox.Root>
      Enable notifications
    </label>
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

## API reference

Import the component and assemble its parts:

```jsx title="Anatomy"
import { Checkbox } from '@base-ui-components/react/checkbox';

<Checkbox.Root>
  <Checkbox.Indicator />
</Checkbox.Root>;
```

### Root

Represents the checkbox itself.
Renders a `<button>` element and a hidden `<input>` beside.

**Root Props:**

| Prop            | Type                                                                        | Default     | Description                                                                                                                                                                                  |
| :-------------- | :-------------------------------------------------------------------------- | :---------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| name            | `string`                                                                    | `undefined` | Identifies the field when a form is submitted.                                                                                                                                               |
| defaultChecked  | `boolean`                                                                   | `false`     | Whether the checkbox is initially ticked.To render a controlled checkbox, use the `checked` prop instead.                                                                                    |
| checked         | `boolean`                                                                   | `undefined` | Whether the checkbox is currently ticked.To render an uncontrolled checkbox, use the `defaultChecked` prop instead.                                                                          |
| onCheckedChange | `((checked: boolean, event: Event) => void)`                                | -           | Event handler called when the checkbox is ticked or unticked.                                                                                                                                |
| indeterminate   | `boolean`                                                                   | `false`     | Whether the checkbox is in a mixed state: neither ticked, nor unticked.                                                                                                                      |
| value           | `string \| number`                                                          | -           | The value of the selected checkbox.                                                                                                                                                          |
| parent          | `boolean`                                                                   | `false`     | Whether the checkbox controls a group of child checkboxes.Must be used in a [Checkbox Group](https://base-ui.com/react/components/checkbox-group).                                           |
| disabled        | `boolean`                                                                   | `false`     | Whether the component should ignore user interaction.                                                                                                                                        |
| readOnly        | `boolean`                                                                   | `false`     | Whether the user should be unable to tick or untick the checkbox.                                                                                                                            |
| required        | `boolean`                                                                   | `false`     | Whether the user must tick the checkbox before submitting a form.                                                                                                                            |
| inputRef        | `Ref<HTMLInputElement>`                                                     | -           | A React ref to access the hidden `<input>` element.                                                                                                                                          |
| id              | `string`                                                                    | -           | The id of the input element.                                                                                                                                                                 |
| className       | `string \| ((state: State) => string)`                                      | -           | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render          | `ReactElement \| ((props: GenericHTMLProps, state: State) => ReactElement)` | -           | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

**Root Data Attributes:**

| Attribute      | Type | Description                                                                 |
| :------------- | :--- | :-------------------------------------------------------------------------- |
| data-checked   | -    | Present when the checkbox is checked.                                       |
| data-unchecked | -    | Present when the checkbox is not checked.                                   |
| data-disabled  | -    | Present when the checkbox is disabled.                                      |
| data-readonly  | -    | Present when the checkbox is readonly.                                      |
| data-required  | -    | Present when the checkbox is required.                                      |
| data-valid     | -    | Present when the checkbox is in valid state (when wrapped in Field.Root).   |
| data-invalid   | -    | Present when the checkbox is in invalid state (when wrapped in Field.Root). |
| data-dirty     | -    | Present when the checkbox's value has changed (when wrapped in Field.Root). |
| data-touched   | -    | Present when the checkbox has been touched (when wrapped in Field.Root).    |
| data-filled    | -    | Present when the checkbox is checked (when wrapped in Field.Root).          |
| data-focused   | -    | Present when the checkbox is focused (when wrapped in Field.Root).          |

### Indicator

Indicates whether the checkbox is ticked.
Renders a `<span>` element.

**Indicator Props:**

| Prop        | Type                                                                        | Default | Description                                                                                                                                                                                  |
| :---------- | :-------------------------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| className   | `string \| ((state: State) => string)`                                      | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| keepMounted | `boolean`                                                                   | `false` | Whether to keep the element in the DOM when the checkbox is not checked.                                                                                                                     |
| render      | `ReactElement \| ((props: GenericHTMLProps, state: State) => ReactElement)` | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

**Indicator Data Attributes:**

| Attribute           | Type | Description                                                                 |
| :------------------ | :--- | :-------------------------------------------------------------------------- |
| data-checked        | -    | Present when the checkbox is checked.                                       |
| data-unchecked      | -    | Present when the checkbox is not checked.                                   |
| data-disabled       | -    | Present when the checkbox is disabled.                                      |
| data-readonly       | -    | Present when the checkbox is readonly.                                      |
| data-required       | -    | Present when the checkbox is required.                                      |
| data-valid          | -    | Present when the checkbox is in valid state (when wrapped in Field.Root).   |
| data-invalid        | -    | Present when the checkbox is in invalid state (when wrapped in Field.Root). |
| data-dirty          | -    | Present when the checkbox's value has changed (when wrapped in Field.Root). |
| data-touched        | -    | Present when the checkbox has been touched (when wrapped in Field.Root).    |
| data-filled         | -    | Present when the checkbox is checked (when wrapped in Field.Root).          |
| data-focused        | -    | Present when the checkbox is focused (when wrapped in Field.Root).          |
| data-starting-style | -    | Present when the checkbox indicator is animating in.                        |
| data-ending-style   | -    | Present when the checkbox indicator is animating out.                       |
