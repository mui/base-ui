---
title: Progress
subtitle: Displays the status of a task that takes a long time.
description: A high-quality, unstyled React progress bar component that displays the status of a task that takes a long time.
---
# Progress

A high-quality, unstyled React progress bar component that displays the status of a task that takes a long time.

## Demo

### CSS Modules

This example shows how to implement the component using CSS Modules.

```css
/* index.module.css */
.Track {
  width: 12rem;
  display: block;
  overflow: hidden;
  background-color: var(--color-gray-200);
  box-shadow: inset 0 0 0 1px var(--color-gray-200);
  height: 0.25rem;
  border-radius: 0.25rem;
}

.Indicator {
  display: block;
  background-color: var(--color-gray-500);
  transition: width 500ms;
}
```

```tsx
/* index.tsx */
import * as React from "react";
import { Progress } from "@base-ui-components/react/progress";
import styles from "./index.module.css";

export default function ExampleProgress() {
  const [value, setValue] = React.useState(20);

  // Simulate changes
  React.useEffect(() => {
    const interval = window.setInterval(() => {
      setValue((current) =>
        Math.min(100, Math.round(current + Math.random() * 25)),
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Progress.Root value={value}>
      <Progress.Track className={styles.Track}>
        <Progress.Indicator className={styles.Indicator} />
      </Progress.Track>
    </Progress.Root>
  );
}
```

### Tailwind

This example shows how to implement the component using Tailwind CSS.

```tsx
/* index.tsx */
import * as React from "react";
import { Progress } from "@base-ui-components/react/progress";

export default function ExampleProgress() {
  const [value, setValue] = React.useState(20);

  // Simulate changes
  React.useEffect(() => {
    const interval = window.setInterval(() => {
      setValue((current) =>
        Math.min(100, Math.round(current + Math.random() * 25)),
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Progress.Root value={value}>
      <Progress.Track className="block h-1 w-48 overflow-hidden rounded bg-gray-200 shadow-[inset_0_0_0_1px] shadow-gray-200">
        <Progress.Indicator className="block bg-gray-500 transition-all duration-500" />
      </Progress.Track>
    </Progress.Root>
  );
}
```

## API reference

Import the component and assemble its parts:

```jsx title="Anatomy"
import { Progress } from "@base-ui-components/react/progress";

<Progress.Root>
  <Progress.Track>
    <Progress.Indicator />
  </Progress.Track>
  <Progress.Value />
</Progress.Root>;
```

### Root

Groups all parts of the progress bar and provides the task completion status to screen readers.
Renders a `<div>` element.

**Root Props:**

| Prop             | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Default | Description                                                                                                                                                                                  |
| :--------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| aria-label       | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | -       | The label for the Indicator component.                                                                                                                                                       |
| aria-labelledby  | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | -       | An id or space-separated list of ids of elements that label the Indicator component.                                                                                                         |
| value            | `number`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | `null`  | The current value. The component is indeterminate when value is `null`.                                                                                                                      |
| aria-valuetext   | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | -       | A string value that provides a human-readable text alternative for the current value of the progress indicator.                                                                              |
| getAriaLabel     | `(value) => string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | -       | Accepts a function which returns a string value that provides an accessible name for the Indicator component.                                                                                |
| getAriaValueText | `(value) => string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | -       | Accepts a function which returns a string value that provides a human-readable text alternative for the current value of the progress indicator.                                             |
| min              | `number`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | `0`     | The minimum value.                                                                                                                                                                           |
| max              | `number`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | `100`   | The maximum value.                                                                                                                                                                           |
| format           | `{ compactDisplay?: 'long' \| 'short', currency?: string, currencyDisplay?: 'code' \| 'name' \| 'narrowSymbol' \| 'symbol', currencySign?: 'accounting' \| 'standard', localeMatcher?: 'best fit' \| 'lookup', maximumFractionDigits?: number, maximumSignificantDigits?: number, minimumFractionDigits?: number, minimumIntegerDigits?: number, minimumSignificantDigits?: number, notation?: 'compact' \| 'engineering' \| 'scientific' \| 'standard', numberingSystem?: string, signDisplay?: 'always' \| 'auto' \| 'exceptZero' \| 'never', style?: 'currency' \| 'decimal' \| 'percent' \| 'unit', unit?: string, unitDisplay?: 'long' \| 'narrow' \| 'short', useGrouping?: bool }` | -       | Options to format the value.                                                                                                                                                                 |
| className        | `string \| (state) => string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render           | `React.ReactElement \| (props, state) => React.ReactElement`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

**Root Data Attributes:**

| Attribute          | Type | Description                                        |
| :----------------- | :--- | :------------------------------------------------- |
| data-complete      | -    | Present when the progress has completed.           |
| data-indeterminate | -    | Present when the progress is in interminate state. |
| data-progressing   | -    | Present while the progress is progressing.         |

### Track

Contains the progress bar indicator.
Renders a `<div>` element.

**Track Props:**

| Prop      | Type                                                         | Default | Description                                                                                                                                                                                  |
| :-------- | :----------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| className | `string \| (state) => string`                                | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render    | `React.ReactElement \| (props, state) => React.ReactElement` | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

**Track Data Attributes:**

| Attribute          | Type | Description                                        |
| :----------------- | :--- | :------------------------------------------------- |
| data-complete      | -    | Present when the progress has completed.           |
| data-indeterminate | -    | Present when the progress is in interminate state. |
| data-progressing   | -    | Present while the progress is progressing.         |

### Indicator

Visualizes the completion status of the task.
Renders a `<div>` element.

**Indicator Props:**

| Prop      | Type                                                         | Default | Description                                                                                                                                                                                  |
| :-------- | :----------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| className | `string \| (state) => string`                                | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render    | `React.ReactElement \| (props, state) => React.ReactElement` | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

**Indicator Data Attributes:**

| Attribute          | Type | Description                                        |
| :----------------- | :--- | :------------------------------------------------- |
| data-complete      | -    | Present when the progress has completed.           |
| data-indeterminate | -    | Present when the progress is in interminate state. |
| data-progressing   | -    | Present while the progress is progressing.         |

### Value

A text label displaying the current value.
Renders a `<span>` element.

**Value Props:**

| Prop      | Type                                                         | Default | Description                                                                                                                                                                                  |
| :-------- | :----------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| className | `string \| (state) => string`                                | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render    | `React.ReactElement \| (props, state) => React.ReactElement` | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |
