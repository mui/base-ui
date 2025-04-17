---
title: Number Field
subtitle: A numeric input element with increment and decrement buttons, and a scrub area.
description: A high-quality, unstyled React number field component with increment and decrement buttons, and a scrub area.
---
# Number Field

A high-quality, unstyled React number field component with increment and decrement buttons, and a scrub area.

## Demo

### CSS Modules

This example shows how to implement the component using CSS Modules.

```css
/* index.module.css */
.Field {
  display: flex;
  flex-direction: column;
  align-items: start;
  gap: 0.25rem;
}

.ScrubArea {
  cursor: ew-resize;
  font-weight: bold;
  user-select: none;
}

.ScrubAreaCursor {
  filter: drop-shadow(0 1px 1px #0008);
}

.Label {
  cursor: ew-resize;
  font-size: 0.875rem;
  line-height: 1.25rem;
  font-weight: 500;
  color: var(--color-gray-900);
}

.Group {
  display: flex;
}

.Input {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  border-top: 1px solid var(--color-gray-200);
  border-bottom: 1px solid var(--color-gray-200);
  border-left: none;
  border-right: none;
  width: 6rem;
  height: 2.5rem;
  font-family: inherit;
  font-size: 1rem;
  font-weight: normal;
  background-color: transparent;
  color: var(--color-gray-900);

  text-align: center;
  font-variant-numeric: tabular-nums;

  &:focus {
    z-index: 1;
    outline: 2px solid var(--color-blue);
    outline-offset: -1px;
  }
}

.Decrement,
.Increment {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  margin: 0;
  outline: 0;
  padding: 0;
  border: 1px solid var(--color-gray-200);
  border-radius: 0.375rem;
  background-color: var(--color-gray-50);
  background-clip: padding-box;
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
}

.Decrement {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}

.Increment {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}
```

```tsx
/* index.tsx */
import * as React from 'react';
import { NumberField } from '@base-ui-components/react/number-field';
import styles from './index.module.css';

export default function ExampleNumberField() {
  const id = React.useId();
  return (
    <NumberField.Root id={id} defaultValue={100} className={styles.Field}>
      <NumberField.ScrubArea className={styles.ScrubArea}>
        <label htmlFor={id} className={styles.Label}>
          Amount
        </label>
        <NumberField.ScrubAreaCursor className={styles.ScrubAreaCursor}>
          <CursorGrowIcon />
        </NumberField.ScrubAreaCursor>
      </NumberField.ScrubArea>

      <NumberField.Group className={styles.Group}>
        <NumberField.Decrement className={styles.Decrement}>
          <MinusIcon />
        </NumberField.Decrement>
        <NumberField.Input className={styles.Input} />
        <NumberField.Increment className={styles.Increment}>
          <PlusIcon />
        </NumberField.Increment>
      </NumberField.Group>
    </NumberField.Root>
  );
}

function CursorGrowIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="26"
      height="14"
      viewBox="0 0 24 14"
      fill="black"
      stroke="white"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M19.5 5.5L6.49737 5.51844V2L1 6.9999L6.5 12L6.49737 8.5L19.5 8.5V12L25 6.9999L19.5 2V5.5Z" />
    </svg>
  );
}

function PlusIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      stroke="currentcolor"
      strokeWidth="1.6"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M0 5H5M10 5H5M5 5V0M5 5V10" />
    </svg>
  );
}

function MinusIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      stroke="currentcolor"
      strokeWidth="1.6"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M0 5H10" />
    </svg>
  );
}
```

### Tailwind

This example shows how to implement the component using Tailwind CSS.

```tsx
/* index.tsx */
import * as React from 'react';
import { NumberField } from '@base-ui-components/react/number-field';

export default function ExampleNumberField() {
  const id = React.useId();
  return (
    <NumberField.Root
      id={id}
      defaultValue={100}
      className="flex flex-col items-start gap-1"
    >
      <NumberField.ScrubArea className="cursor-ew-resize">
        <label
          htmlFor={id}
          className="cursor-ew-resize text-sm font-medium text-gray-900"
        >
          Amount
        </label>
        <NumberField.ScrubAreaCursor className="drop-shadow-[0_1px_1px_#0008] filter">
          <CursorGrowIcon />
        </NumberField.ScrubAreaCursor>
      </NumberField.ScrubArea>

      <NumberField.Group className="flex">
        <NumberField.Decrement className="flex size-10 items-center justify-center rounded-tl-md rounded-bl-md border border-gray-200 bg-gray-50 bg-clip-padding text-gray-900 select-none hover:bg-gray-100 active:bg-gray-100">
          <MinusIcon />
        </NumberField.Decrement>
        <NumberField.Input className="h-10 w-24 border-t border-b border-gray-200 text-center text-base text-gray-900 tabular-nums focus:z-1 focus:outline focus:outline-2 focus:-outline-offset-1 focus:outline-blue-800" />
        <NumberField.Increment className="flex size-10 items-center justify-center rounded-tr-md rounded-br-md border border-gray-200 bg-gray-50 bg-clip-padding text-gray-900 select-none hover:bg-gray-100 active:bg-gray-100">
          <PlusIcon />
        </NumberField.Increment>
      </NumberField.Group>
    </NumberField.Root>
  );
}

function CursorGrowIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="26"
      height="14"
      viewBox="0 0 24 14"
      fill="black"
      stroke="white"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M19.5 5.5L6.49737 5.51844V2L1 6.9999L6.5 12L6.49737 8.5L19.5 8.5V12L25 6.9999L19.5 2V5.5Z" />
    </svg>
  );
}

function PlusIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      stroke="currentcolor"
      strokeWidth="1.6"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M0 5H5M10 5H5M5 5V0M5 5V10" />
    </svg>
  );
}

function MinusIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      stroke="currentcolor"
      strokeWidth="1.6"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M0 5H10" />
    </svg>
  );
}
```

## API reference

Import the component and assemble its parts:

```jsx title="Anatomy"
import { NumberField } from '@base-ui-components/react/number-field';

<NumberField.Root>
  <NumberField.ScrubArea>
    <NumberField.ScrubAreaCursor />
  </NumberField.ScrubArea>
  <NumberField.Group>
    <NumberField.Decrement />
    <NumberField.Input />
    <NumberField.Increment />
  </NumberField.Group>
</NumberField.Root>;
```

### Root

Groups all parts of the number field and manages its state.
Renders a `<div>` element.

**Root Props:**

| Prop            | Type                                                                        | Default | Description                                                                                                                                                                                  |
| :-------------- | :-------------------------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| name            | `string`                                                                    | -       | Identifies the field when a form is submitted.                                                                                                                                               |
| defaultValue    | `number`                                                                    | -       | The uncontrolled value of the field when it’s initially rendered.To render a controlled number field, use the `value` prop instead.                                                          |
| value           | `number \| null`                                                            | -       | The raw numeric value of the field.                                                                                                                                                          |
| onValueChange   | `((value: number \| null, event: Event \| undefined) => void)`              | -       | Callback fired when the number value changes.                                                                                                                                                |
| locale          | `LocalesArgument`                                                           | -       | The locale of the input element.&#xA;Defaults to the user's runtime locale.                                                                                                                  |
| snapOnStep      | `boolean`                                                                   | `false` | Whether the value should snap to the nearest step when incrementing or decrementing.                                                                                                         |
| step            | `number`                                                                    | `1`     | Amount to increment and decrement with the buttons and arrow keys,&#xA;or to scrub with pointer movement in the scrub area.                                                                  |
| smallStep       | `number`                                                                    | `0.1`   | The small step value of the input element when incrementing while the meta key is held. Snaps&#xA;to multiples of this value.                                                                |
| largeStep       | `number`                                                                    | `10`    | The large step value of the input element when incrementing while the shift key is held. Snaps&#xA;to multiples of this value.                                                               |
| min             | `number`                                                                    | -       | The minimum value of the input element.                                                                                                                                                      |
| max             | `number`                                                                    | -       | The maximum value of the input element.                                                                                                                                                      |
| allowWheelScrub | `boolean`                                                                   | `false` | Whether to allow the user to scrub the input value with the mouse wheel while focused and&#xA;hovering over the input.                                                                       |
| format          | `NumberFormatOptions`                                                       | -       | Options to format the input value.                                                                                                                                                           |
| disabled        | `boolean`                                                                   | `false` | Whether the component should ignore user interaction.                                                                                                                                        |
| readOnly        | `boolean`                                                                   | `false` | Whether the user should be unable to change the field value.                                                                                                                                 |
| required        | `boolean`                                                                   | `false` | Whether the user must enter a value before submitting a form.                                                                                                                                |
| invalid         | `boolean`                                                                   | `false` | Whether the field is forcefully marked as invalid.                                                                                                                                           |
| id              | `string`                                                                    | -       | The id of the input element.                                                                                                                                                                 |
| className       | `string \| ((state: State) => string)`                                      | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render          | `ReactElement \| ((props: GenericHTMLProps, state: State) => ReactElement)` | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

**Root Data Attributes:**

| Attribute      | Type | Description                                                                     |
| :------------- | :--- | :------------------------------------------------------------------------------ |
| data-disabled  | -    | Present when the number field is disabled.                                      |
| data-readonly  | -    | Present when the number field is readonly.                                      |
| data-required  | -    | Present when the number field is required.                                      |
| data-valid     | -    | Present when the number field is in valid state (when wrapped in Field.Root).   |
| data-invalid   | -    | Present when the number field is in invalid state (when wrapped in Field.Root). |
| data-dirty     | -    | Present when the number field's value has changed (when wrapped in Field.Root). |
| data-touched   | -    | Present when the number field has been touched (when wrapped in Field.Root).    |
| data-filled    | -    | Present when the number field is filled (when wrapped in Field.Root).           |
| data-focused   | -    | Present when the number field is focused (when wrapped in Field.Root).          |
| data-scrubbing | -    | Present while scrubbing.                                                        |

### ScrubArea

An interactive area where the user can click and drag to change the field value.
Renders a `<span>` element.

**ScrubArea Props:**

| Prop             | Type                                                                        | Default        | Description                                                                                                                                                                                  |
| :--------------- | :-------------------------------------------------------------------------- | :------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| direction        | `'horizontal' \| 'vertical'`                                                | `'horizontal'` | Cursor movement direction in the scrub area.                                                                                                                                                 |
| pixelSensitivity | `number`                                                                    | `2`            | Determines how many pixels the cursor must move before the value changes.&#xA;A higher value will make scrubbing less sensitive.                                                             |
| teleportDistance | `number`                                                                    | -              | If specified, determines the distance that the cursor may move from the center&#xA;of the scrub area before it will loop back around.                                                        |
| className        | `string \| ((state: State) => string)`                                      | -              | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render           | `ReactElement \| ((props: GenericHTMLProps, state: State) => ReactElement)` | -              | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

**ScrubArea Data Attributes:**

| Attribute      | Type | Description                                                                     |
| :------------- | :--- | :------------------------------------------------------------------------------ |
| data-disabled  | -    | Present when the number field is disabled.                                      |
| data-readonly  | -    | Present when the number field is readonly.                                      |
| data-required  | -    | Present when the number field is required.                                      |
| data-valid     | -    | Present when the number field is in valid state (when wrapped in Field.Root).   |
| data-invalid   | -    | Present when the number field is in invalid state (when wrapped in Field.Root). |
| data-dirty     | -    | Present when the number field's value has changed (when wrapped in Field.Root). |
| data-touched   | -    | Present when the number field has been touched (when wrapped in Field.Root).    |
| data-filled    | -    | Present when the number field is filled (when wrapped in Field.Root).           |
| data-focused   | -    | Present when the number field is focused (when wrapped in Field.Root).          |
| data-scrubbing | -    | Present while scrubbing.                                                        |

### ScrubAreaCursor

A custom element to display instead of the native cursor while using the scrub area.
Renders a `<span>` element.This component uses the [Pointer Lock API](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_Lock_API), which may prompt the browser to display a related notification. It is disabled
in Safari to avoid a layout shift that this notification causes there.

**ScrubAreaCursor Props:**

| Prop      | Type                                                                        | Default | Description                                                                                                                                                                                  |
| :-------- | :-------------------------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| className | `string \| ((state: State) => string)`                                      | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render    | `ReactElement \| ((props: GenericHTMLProps, state: State) => ReactElement)` | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

**ScrubAreaCursor Data Attributes:**

| Attribute      | Type | Description                                                                     |
| :------------- | :--- | :------------------------------------------------------------------------------ |
| data-disabled  | -    | Present when the number field is disabled.                                      |
| data-readonly  | -    | Present when the number field is readonly.                                      |
| data-required  | -    | Present when the number field is required.                                      |
| data-valid     | -    | Present when the number field is in valid state (when wrapped in Field.Root).   |
| data-invalid   | -    | Present when the number field is in invalid state (when wrapped in Field.Root). |
| data-dirty     | -    | Present when the number field's value has changed (when wrapped in Field.Root). |
| data-touched   | -    | Present when the number field has been touched (when wrapped in Field.Root).    |
| data-filled    | -    | Present when the number field is filled (when wrapped in Field.Root).           |
| data-focused   | -    | Present when the number field is focused (when wrapped in Field.Root).          |
| data-scrubbing | -    | Present while scrubbing.                                                        |

### Group

Groups the input with the increment and decrement buttons.
Renders a `<div>` element.

**Group Props:**

| Prop      | Type                                                                        | Default | Description                                                                                                                                                                                  |
| :-------- | :-------------------------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| className | `string \| ((state: State) => string)`                                      | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render    | `ReactElement \| ((props: GenericHTMLProps, state: State) => ReactElement)` | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

**Group Data Attributes:**

| Attribute      | Type | Description                                                                     |
| :------------- | :--- | :------------------------------------------------------------------------------ |
| data-disabled  | -    | Present when the number field is disabled.                                      |
| data-readonly  | -    | Present when the number field is readonly.                                      |
| data-required  | -    | Present when the number field is required.                                      |
| data-valid     | -    | Present when the number field is in valid state (when wrapped in Field.Root).   |
| data-invalid   | -    | Present when the number field is in invalid state (when wrapped in Field.Root). |
| data-dirty     | -    | Present when the number field's value has changed (when wrapped in Field.Root). |
| data-touched   | -    | Present when the number field has been touched (when wrapped in Field.Root).    |
| data-filled    | -    | Present when the number field is filled (when wrapped in Field.Root).           |
| data-focused   | -    | Present when the number field is focused (when wrapped in Field.Root).          |
| data-scrubbing | -    | Present while scrubbing.                                                        |

### Decrement

A stepper button that decreases the field value when clicked.
Renders an `<button>` element.

**Decrement Props:**

| Prop      | Type                                                                        | Default | Description                                                                                                                                                                                  |
| :-------- | :-------------------------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| className | `string \| ((state: State) => string)`                                      | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render    | `ReactElement \| ((props: GenericHTMLProps, state: State) => ReactElement)` | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

**Decrement Data Attributes:**

| Attribute      | Type | Description                                                                     |
| :------------- | :--- | :------------------------------------------------------------------------------ |
| data-disabled  | -    | Present when the number field is disabled.                                      |
| data-readonly  | -    | Present when the number field is readonly.                                      |
| data-required  | -    | Present when the number field is required.                                      |
| data-valid     | -    | Present when the number field is in valid state (when wrapped in Field.Root).   |
| data-invalid   | -    | Present when the number field is in invalid state (when wrapped in Field.Root). |
| data-dirty     | -    | Present when the number field's value has changed (when wrapped in Field.Root). |
| data-touched   | -    | Present when the number field has been touched (when wrapped in Field.Root).    |
| data-filled    | -    | Present when the number field is filled (when wrapped in Field.Root).           |
| data-focused   | -    | Present when the number field is focused (when wrapped in Field.Root).          |
| data-scrubbing | -    | Present while scrubbing.                                                        |

### Input

The native input control in the number field.
Renders an `<input>` element.

**Input Props:**

| Prop      | Type                                                                        | Default | Description                                                                                                                                                                                  |
| :-------- | :-------------------------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| className | `string \| ((state: State) => string)`                                      | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render    | `ReactElement \| ((props: GenericHTMLProps, state: State) => ReactElement)` | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

**Input Data Attributes:**

| Attribute      | Type | Description                                                                     |
| :------------- | :--- | :------------------------------------------------------------------------------ |
| data-disabled  | -    | Present when the number field is disabled.                                      |
| data-readonly  | -    | Present when the number field is readonly.                                      |
| data-required  | -    | Present when the number field is required.                                      |
| data-valid     | -    | Present when the number field is in valid state (when wrapped in Field.Root).   |
| data-invalid   | -    | Present when the number field is in invalid state (when wrapped in Field.Root). |
| data-dirty     | -    | Present when the number field's value has changed (when wrapped in Field.Root). |
| data-touched   | -    | Present when the number field has been touched (when wrapped in Field.Root).    |
| data-filled    | -    | Present when the number field is filled (when wrapped in Field.Root).           |
| data-focused   | -    | Present when the number field is focused (when wrapped in Field.Root).          |
| data-scrubbing | -    | Present while scrubbing.                                                        |

### Increment

A stepper button that increases the field value when clicked.
Renders an `<button>` element.

**Increment Props:**

| Prop      | Type                                                                        | Default | Description                                                                                                                                                                                  |
| :-------- | :-------------------------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| className | `string \| ((state: State) => string)`                                      | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render    | `ReactElement \| ((props: GenericHTMLProps, state: State) => ReactElement)` | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

**Increment Data Attributes:**

| Attribute      | Type | Description                                                                     |
| :------------- | :--- | :------------------------------------------------------------------------------ |
| data-disabled  | -    | Present when the number field is disabled.                                      |
| data-readonly  | -    | Present when the number field is readonly.                                      |
| data-required  | -    | Present when the number field is required.                                      |
| data-valid     | -    | Present when the number field is in valid state (when wrapped in Field.Root).   |
| data-invalid   | -    | Present when the number field is in invalid state (when wrapped in Field.Root). |
| data-dirty     | -    | Present when the number field's value has changed (when wrapped in Field.Root). |
| data-touched   | -    | Present when the number field has been touched (when wrapped in Field.Root).    |
| data-filled    | -    | Present when the number field is filled (when wrapped in Field.Root).           |
| data-focused   | -    | Present when the number field is focused (when wrapped in Field.Root).          |
| data-scrubbing | -    | Present while scrubbing.                                                        |
