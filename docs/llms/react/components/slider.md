---
title: Slider
subtitle: An easily stylable range input.
description: A high-quality, unstyled React slider component that works like a range input and is easy to style.
---

# Slider

A high-quality, unstyled React slider component that works like a range input and is easy to style.

## Demo

### CSS Modules

This example shows how to implement the component using CSS Modules.

```css
/* index.module.css */
.Control {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  width: 14rem;
  padding-block: 0.75rem;
  touch-action: none;
  user-select: none;
}

.Track {
  width: 100%;
  height: 0.25rem;
  background-color: var(--color-gray-200);
  box-shadow: inset 0 0 0 1px var(--color-gray-200);
  border-radius: 0.25rem;
  user-select: none;
}

.Indicator {
  border-radius: 0.25rem;
  background-color: var(--color-gray-700);
  user-select: none;
}

.Thumb {
  width: 1rem;
  height: 1rem;
  border-radius: 100%;
  background-color: white;
  outline: 1px solid var(--color-gray-300);
  user-select: none;

  &:focus-visible {
    outline: 2px solid var(--color-blue);
  }
}
```

```tsx
/* index.tsx */
import * as React from 'react';
import { Slider } from '@base-ui-components/react/slider';
import styles from './index.module.css';

export default function ExampleSlider() {
  return (
    <Slider.Root defaultValue={25}>
      <Slider.Control className={styles.Control}>
        <Slider.Track className={styles.Track}>
          <Slider.Indicator className={styles.Indicator} />
          <Slider.Thumb className={styles.Thumb} />
        </Slider.Track>
      </Slider.Control>
    </Slider.Root>
  );
}
```

### Tailwind

This example shows how to implement the component using Tailwind CSS.

```tsx
/* index.tsx */
import * as React from 'react';
import { Slider } from '@base-ui-components/react/slider';

export default function ExampleSlider() {
  return (
    <Slider.Root defaultValue={25}>
      <Slider.Control className="flex w-56 touch-none items-center py-3 select-none">
        <Slider.Track className="h-1 w-full rounded bg-gray-200 shadow-[inset_0_0_0_1px] shadow-gray-200 select-none">
          <Slider.Indicator className="rounded bg-gray-700 select-none" />
          <Slider.Thumb className="size-4 rounded-full bg-white outline outline-1 outline-gray-300 select-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-800" />
        </Slider.Track>
      </Slider.Control>
    </Slider.Root>
  );
}
```

## API reference

Import the component and assemble its parts:

```jsx title="Anatomy"
import { Slider } from '@base-ui-components/react/slider';

<Slider.Root>
  <Slider.Value />
  <Slider.Control>
    <Slider.Track>
      <Slider.Indicator />
      <Slider.Thumb />
    </Slider.Track>
  </Slider.Control>
</Slider.Root>;
```

### Root

Groups all parts of the slider.
Renders a `<div>` element.

**Root Props:**

| Prop                  | Type                                                                        | Default        | Description                                                                                                                                                                                                          |
| :-------------------- | :-------------------------------------------------------------------------- | :------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| name                  | `string`                                                                    | -              | Identifies the field when a form is submitted.                                                                                                                                                                       |
| defaultValue          | `number \| readonly number[]`                                               | -              | The uncontrolled value of the slider when it’s initially rendered.To render a controlled slider, use the `value` prop instead.                                                                                       |
| value                 | `number \| readonly number[]`                                               | -              | The value of the slider.&#xA;For ranged sliders, provide an array with two values.                                                                                                                                   |
| onValueChange         | `((value: any, event: Event, activeThumbIndex: number) => void)`            | -              | Callback function that is fired when the slider's value changed.                                                                                                                                                     |
| onValueCommitted      | `((value: any, event: Event) => void)`                                      | -              | Callback function that is fired when the `pointerup` is triggered.                                                                                                                                                   |
| ref                   | `RefObject<HTMLDivElement>`                                                 | -              | -                                                                                                                                                                                                                    |
| tabIndex              | `number`                                                                    | -              | Optional tab index attribute for the thumb components.                                                                                                                                                               |
| step                  | `number`                                                                    | `1`            | The granularity with which the slider can step through values. (A "discrete" slider.)&#xA;The `min` prop serves as the origin for the valid values.&#xA;We recommend (max - min) to be evenly divisible by the step. |
| largeStep             | `number`                                                                    | `10`           | The granularity with which the slider can step through values when using Page Up/Page Down or Shift + Arrow Up/Arrow Down.                                                                                           |
| minStepsBetweenValues | `number`                                                                    | `0`            | The minimum steps between values in a range slider.                                                                                                                                                                  |
| min                   | `number`                                                                    | `0`            | The minimum allowed value of the slider.&#xA;Should not be equal to max.                                                                                                                                             |
| max                   | `number`                                                                    | `100`          | The maximum allowed value of the slider.&#xA;Should not be equal to min.                                                                                                                                             |
| format                | `NumberFormatOptions`                                                       | -              | Options to format the input value.                                                                                                                                                                                   |
| disabled              | `boolean`                                                                   | `false`        | Whether the component should ignore user interaction.                                                                                                                                                                |
| orientation           | `Orientation`                                                               | `'horizontal'` | The component orientation.                                                                                                                                                                                           |
| className             | `string \| ((state: State) => string)`                                      | -              | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                                             |
| render                | `ReactElement \| ((props: GenericHTMLProps, state: State) => ReactElement)` | -              | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render.                         |

**Root Data Attributes:**

| Attribute        | Type                         | Description                                                               |
| :--------------- | :--------------------------- | :------------------------------------------------------------------------ |
| data-dragging    | -                            | Present while the user is dragging.                                       |
| data-orientation | `'horizontal' \| 'vertical'` | Indicates the orientation of the slider.                                  |
| data-disabled    | -                            | Present when the slider is disabled.                                      |
| data-readonly    | -                            | Present when the slider is readonly.                                      |
| data-required    | -                            | Present when the slider is required.                                      |
| data-valid       | -                            | Present when the slider is in valid state (when wrapped in Field.Root).   |
| data-invalid     | -                            | Present when the slider is in invalid state (when wrapped in Field.Root). |
| data-dirty       | -                            | Present when the slider's value has changed (when wrapped in Field.Root). |
| data-touched     | -                            | Present when the slider has been touched (when wrapped in Field.Root).    |
| data-focused     | -                            | Present when the slider is focused (when wrapped in Field.Root).          |

### Value

Displays the current value of the slider as text.
Renders an `<output>` element.

**Value Props:**

| Prop      | Type                                                                        | Default | Description                                                                                                                                                                                  |
| :-------- | :-------------------------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| aria-live | `'off' \| 'assertive' \| 'polite'`                                          | `'off'` | -                                                                                                                                                                                            |
| children  | `((formattedValues: string[], values: number[]) => ReactNode) \| null`      | -       | \*                                                                                                                                                                                           |
| className | `string \| ((state: State) => string)`                                      | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render    | `ReactElement \| ((props: GenericHTMLProps, state: State) => ReactElement)` | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

**Value Data Attributes:**

| Attribute        | Type                         | Description                                                               |
| :--------------- | :--------------------------- | :------------------------------------------------------------------------ |
| data-dragging    | -                            | Present while the user is dragging.                                       |
| data-orientation | `'horizontal' \| 'vertical'` | Indicates the orientation of the slider.                                  |
| data-disabled    | -                            | Present when the slider is disabled.                                      |
| data-readonly    | -                            | Present when the slider is readonly.                                      |
| data-required    | -                            | Present when the slider is required.                                      |
| data-valid       | -                            | Present when the slider is in valid state (when wrapped in Field.Root).   |
| data-invalid     | -                            | Present when the slider is in invalid state (when wrapped in Field.Root). |
| data-dirty       | -                            | Present when the slider's value has changed (when wrapped in Field.Root). |
| data-touched     | -                            | Present when the slider has been touched (when wrapped in Field.Root).    |
| data-focused     | -                            | Present when the slider is focused (when wrapped in Field.Root).          |

### Control

The clickable, interactive part of the slider.
Renders a `<div>` element.

**Control Props:**

| Prop      | Type                                                                        | Default | Description                                                                                                                                                                                  |
| :-------- | :-------------------------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| className | `string \| ((state: State) => string)`                                      | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render    | `ReactElement \| ((props: GenericHTMLProps, state: State) => ReactElement)` | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

**Control Data Attributes:**

| Attribute        | Type                         | Description                                                               |
| :--------------- | :--------------------------- | :------------------------------------------------------------------------ |
| data-dragging    | -                            | Present while the user is dragging.                                       |
| data-orientation | `'horizontal' \| 'vertical'` | Indicates the orientation of the slider.                                  |
| data-disabled    | -                            | Present when the slider is disabled.                                      |
| data-readonly    | -                            | Present when the slider is readonly.                                      |
| data-required    | -                            | Present when the slider is required.                                      |
| data-valid       | -                            | Present when the slider is in valid state (when wrapped in Field.Root).   |
| data-invalid     | -                            | Present when the slider is in invalid state (when wrapped in Field.Root). |
| data-dirty       | -                            | Present when the slider's value has changed (when wrapped in Field.Root). |
| data-touched     | -                            | Present when the slider has been touched (when wrapped in Field.Root).    |
| data-focused     | -                            | Present when the slider is focused (when wrapped in Field.Root).          |

### Track

Contains the slider indicator and represents the entire range of the slider.
Renders a `<div>` element.

**Track Props:**

| Prop      | Type                                                                        | Default | Description                                                                                                                                                                                  |
| :-------- | :-------------------------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| className | `string \| ((state: State) => string)`                                      | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render    | `ReactElement \| ((props: GenericHTMLProps, state: State) => ReactElement)` | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

**Track Data Attributes:**

| Attribute        | Type                         | Description                                                               |
| :--------------- | :--------------------------- | :------------------------------------------------------------------------ |
| data-dragging    | -                            | Present while the user is dragging.                                       |
| data-orientation | `'horizontal' \| 'vertical'` | Indicates the orientation of the slider.                                  |
| data-disabled    | -                            | Present when the slider is disabled.                                      |
| data-readonly    | -                            | Present when the slider is readonly.                                      |
| data-required    | -                            | Present when the slider is required.                                      |
| data-valid       | -                            | Present when the slider is in valid state (when wrapped in Field.Root).   |
| data-invalid     | -                            | Present when the slider is in invalid state (when wrapped in Field.Root). |
| data-dirty       | -                            | Present when the slider's value has changed (when wrapped in Field.Root). |
| data-touched     | -                            | Present when the slider has been touched (when wrapped in Field.Root).    |
| data-focused     | -                            | Present when the slider is focused (when wrapped in Field.Root).          |

### Indicator

Visualizes the current value of the slider.
Renders a `<div>` element.

**Indicator Props:**

| Prop      | Type                                                                        | Default | Description                                                                                                                                                                                  |
| :-------- | :-------------------------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| className | `string \| ((state: State) => string)`                                      | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render    | `ReactElement \| ((props: GenericHTMLProps, state: State) => ReactElement)` | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

**Indicator Data Attributes:**

| Attribute        | Type                         | Description                                                               |
| :--------------- | :--------------------------- | :------------------------------------------------------------------------ |
| data-dragging    | -                            | Present while the user is dragging.                                       |
| data-orientation | `'horizontal' \| 'vertical'` | Indicates the orientation of the slider.                                  |
| data-disabled    | -                            | Present when the slider is disabled.                                      |
| data-readonly    | -                            | Present when the slider is readonly.                                      |
| data-required    | -                            | Present when the slider is required.                                      |
| data-valid       | -                            | Present when the slider is in valid state (when wrapped in Field.Root).   |
| data-invalid     | -                            | Present when the slider is in invalid state (when wrapped in Field.Root). |
| data-dirty       | -                            | Present when the slider's value has changed (when wrapped in Field.Root). |
| data-touched     | -                            | Present when the slider has been touched (when wrapped in Field.Root).    |
| data-focused     | -                            | Present when the slider is focused (when wrapped in Field.Root).          |

### Thumb

The draggable part of the the slider at the tip of the indicator.
Renders a `<div>` element.

**Thumb Props:**

| Prop                  | Type                                                                                                                                                                                                                                         | Default        | Description                                                                                                                                                                                  |
| :-------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| aria-label            | `string`                                                                                                                                                                                                                                     | -              | The label for the input element.                                                                                                                                                             |
| aria-labelledby       | `string`                                                                                                                                                                                                                                     | -              | -                                                                                                                                                                                            |
| name                  | `string`                                                                                                                                                                                                                                     | -              | \*                                                                                                                                                                                           |
| active                | `number`                                                                                                                                                                                                                                     | -              | The index of the active thumb.                                                                                                                                                               |
| aria-valuetext        | `string`                                                                                                                                                                                                                                     | -              | A string value that provides a user-friendly name for the current value of the slider.                                                                                                       |
| getAriaLabel          | `((index: number) => string) \| null`                                                                                                                                                                                                        | -              | Accepts a function which returns a string value that provides a user-friendly name for the input associated with the thumb                                                                   |
| getAriaValueText      | `((formattedValue: string, value: number, index: number) => string) \| null`                                                                                                                                                                 | -              | Accepts a function which returns a string value that provides a user-friendly name for the current value of the slider.&#xA;This is important for screen reader users.                       |
| handleInputChange     | `((valueInput: number, index: number, event: KeyboardEvent<Element> \| ChangeEvent<Element>) => void)`                                                                                                                                       | -              | -                                                                                                                                                                                            |
| inputId               | `string`                                                                                                                                                                                                                                     | -              | \*                                                                                                                                                                                           |
| onBlur                | `FocusEventHandler<Element>`                                                                                                                                                                                                                 | -              | -                                                                                                                                                                                            |
| onFocus               | `FocusEventHandler<Element>`                                                                                                                                                                                                                 | -              | \*                                                                                                                                                                                           |
| onKeyDown             | `KeyboardEventHandler<Element>`                                                                                                                                                                                                              | -              | -                                                                                                                                                                                            |
| onPointerLeave        | `PointerEventHandler<Element>`                                                                                                                                                                                                               | -              | \*                                                                                                                                                                                           |
| onPointerOver         | `PointerEventHandler<Element>`                                                                                                                                                                                                               | -              | -                                                                                                                                                                                            |
| percentageValues      | `number[]`                                                                                                                                                                                                                                   | -              | The value(s) of the slider as percentages                                                                                                                                                    |
| tabIndex              | `number \| null`                                                                                                                                                                                                                             | `null`         | Optional tab index attribute for the thumb components.                                                                                                                                       |
| values                | `number[]`                                                                                                                                                                                                                                   | -              | The value(s) of the slider                                                                                                                                                                   |
| step                  | `number`                                                                                                                                                                                                                                     | `1`            | The step increment of the slider when incrementing or decrementing. It will snap&#xA;to multiples of this value. Decimal values are supported.                                               |
| largeStep             | `number`                                                                                                                                                                                                                                     | `10`           | The large step value of the slider when incrementing or decrementing while the shift key is held,&#xA;or when using Page-Up or Page-Down keys. Snaps to multiples of this value.             |
| minStepsBetweenValues | `number`                                                                                                                                                                                                                                     | -              | The minimum steps between values in a range slider.                                                                                                                                          |
| min                   | `number`                                                                                                                                                                                                                                     | -              | The minimum allowed value of the slider.                                                                                                                                                     |
| max                   | `number`                                                                                                                                                                                                                                     | -              | The maximum allowed value of the slider.                                                                                                                                                     |
| format                | `NumberFormatOptions \| null`                                                                                                                                                                                                                | `null`         | Options to format the input value.                                                                                                                                                           |
| disabled              | `boolean`                                                                                                                                                                                                                                    | -              | \*                                                                                                                                                                                           |
| orientation           | `Orientation`                                                                                                                                                                                                                                | `'horizontal'` | The component orientation.                                                                                                                                                                   |
| id                    | `string`                                                                                                                                                                                                                                     | -              | -                                                                                                                                                                                            |
| className             | `string \| ((state: State) => string)`                                                                                                                                                                                                       | -              | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render                | `((props: DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>, inputProps: DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>, state: State) => ReactElement) \| ReactElement & { ref: Ref<Element> }` | -              | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

**Thumb Data Attributes:**

| Attribute        | Type                         | Description                                                               |
| :--------------- | :--------------------------- | :------------------------------------------------------------------------ |
| data-dragging    | -                            | Present while the user is dragging.                                       |
| data-orientation | `'horizontal' \| 'vertical'` | Indicates the orientation of the slider.                                  |
| data-disabled    | -                            | Present when the slider is disabled.                                      |
| data-readonly    | -                            | Present when the slider is readonly.                                      |
| data-required    | -                            | Present when the slider is required.                                      |
| data-valid       | -                            | Present when the slider is in valid state (when wrapped in Field.Root).   |
| data-invalid     | -                            | Present when the slider is in invalid state (when wrapped in Field.Root). |
| data-dirty       | -                            | Present when the slider's value has changed (when wrapped in Field.Root). |
| data-touched     | -                            | Present when the slider has been touched (when wrapped in Field.Root).    |
| data-focused     | -                            | Present when the slider is focused (when wrapped in Field.Root).          |
| data-index       | -                            | Indicates the index of the thumb in range sliders.                        |
