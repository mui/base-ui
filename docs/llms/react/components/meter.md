---
title: Meter
subtitle: A graphical display of a numeric value within a range.
description: A high-quality, unstyled React meter component that provides a graphical display of a numeric value.
---
# Meter

A high-quality, unstyled React meter component that provides a graphical display of a numeric value.

## Demo

### CSS Modules

This example shows how to implement the component using CSS Modules.

```css
/* index.module.css */
.Meter {
  box-sizing: border-box;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-row-gap: 0.5rem;
  width: 12rem;
}

.Label {
  font-size: 0.875rem;
  line-height: 1.25rem;
  font-weight: 500;
  color: var(--color-gray-900);
}

.Value {
  grid-column-start: 2;
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.25rem;
  color: var(--color-gray-900);
  text-align: right;
}

.Track {
  grid-column: 1 / 3;
  overflow: hidden;
  background-color: var(--color-gray-100);
  box-shadow: inset 0 0 0 1px var(--color-gray-200);
  height: 0.5rem;
}

.Indicator {
  background-color: var(--color-gray-500);
  transition: width 500ms;
}
```

```tsx
/* index.tsx */
import * as React from 'react';
import { Meter } from '@base-ui-components/react/meter';
import styles from './index.module.css';

export default function ExampleMeter() {
  return (
    <Meter.Root className={styles.Meter} value={24}>
      <Meter.Label className={styles.Label}>Storage Used</Meter.Label>
      <Meter.Value className={styles.Value} />
      <Meter.Track className={styles.Track}>
        <Meter.Indicator className={styles.Indicator} />
      </Meter.Track>
    </Meter.Root>
  );
}
```

### Tailwind

This example shows how to implement the component using Tailwind CSS.

```tsx
/* index.tsx */
import * as React from 'react';
import { Meter } from '@base-ui-components/react/meter';

export default function ExampleMeter() {
  return (
    <Meter.Root className="box-border grid w-48 grid-cols-2 gap-y-2" value={24}>
      <Meter.Label className="text-sm font-medium text-gray-900">Storage Used</Meter.Label>
      <Meter.Value className="col-start-2 m-0 text-right text-sm leading-5 text-gray-900" />
      <Meter.Track className="col-span-2 block h-2 w-48 overflow-hidden bg-gray-100 shadow-[inset_0_0_0_1px] shadow-gray-200">
        <Meter.Indicator className="block bg-gray-500 transition-all duration-500" />
      </Meter.Track>
    </Meter.Root>
  );
}
```

## API reference

Import the component and assemble its parts:

```jsx title="Anatomy"
import { Meter } from '@base-ui-components/react/meter';

<Meter.Root>
  <Meter.Label />
  <Meter.Track>
    <Meter.Indicator />
  </Meter.Track>
  <Meter.Value />
</Meter.Root>;
```

### Root

Groups all parts of the meter and provides the value for screen readers.
Renders a `<div>` element.

**Root Props:**

| Prop             | Type                                                                        | Default | Description                                                                                                                                                                                  |
| :--------------- | :-------------------------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| value            | `number`                                                                    | -       | The current value.                                                                                                                                                                           |
| getAriaValueText | `((formattedValue: string, value: number) => string)`                       | -       | A function that returns a string value that provides a human-readable text alternative for the current value of the meter.                                                                   |
| locale           | `LocalesArgument`                                                           | -       | The locale used by `Intl.NumberFormat` when formatting the value.&#xA;Defaults to the user's runtime locale.                                                                                 |
| min              | `number`                                                                    | `0`     | The minimum value                                                                                                                                                                            |
| max              | `number`                                                                    | `100`   | The maximum value                                                                                                                                                                            |
| format           | `NumberFormatOptions`                                                       | -       | Options to format the value.                                                                                                                                                                 |
| className        | `string \| ((state: State) => string)`                                      | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render           | `ReactElement \| ((props: GenericHTMLProps, state: State) => ReactElement)` | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

### Track

Contains the meter indicator and represents the entire range of the meter.
Renders a `<div>` element.

**Track Props:**

| Prop      | Type                                                                        | Default | Description                                                                                                                                                                                  |
| :-------- | :-------------------------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| className | `string \| ((state: State) => string)`                                      | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render    | `ReactElement \| ((props: GenericHTMLProps, state: State) => ReactElement)` | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

### Indicator

Visualizes the position of the value along the range.
Renders a `<div>` element.

**Indicator Props:**

| Prop      | Type                                                                        | Default | Description                                                                                                                                                                                  |
| :-------- | :-------------------------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| className | `string \| ((state: State) => string)`                                      | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render    | `ReactElement \| ((props: GenericHTMLProps, state: State) => ReactElement)` | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

### Value

A text element displaying the current value.
Renders a `<span>` element.

**Value Props:**

| Prop      | Type                                                                        | Default | Description                                                                                                                                                                                  |
| :-------- | :-------------------------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| children  | `((formattedValue: string, value: number) => ReactNode) \| null`            | -       | -                                                                                                                                                                                            |
| className | `string \| ((state: State) => string)`                                      | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render    | `ReactElement \| ((props: GenericHTMLProps, state: State) => ReactElement)` | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

### Label

An accessible label for the meter.
Renders a `<span>` element.

**Label Props:**

| Prop      | Type                                                                        | Default | Description                                                                                                                                                                                  |
| :-------- | :-------------------------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| className | `string \| ((state: State) => string)`                                      | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render    | `ReactElement \| ((props: GenericHTMLProps, state: State) => ReactElement)` | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |
