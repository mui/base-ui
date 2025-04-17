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
.Progress {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-gap: 0.25rem;
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
import * as React from 'react';
import { Progress } from '@base-ui-components/react/progress';
import styles from './index.module.css';

export default function ExampleProgress() {
  const [value, setValue] = React.useState(20);

  // Simulate changes
  React.useEffect(() => {
    const interval = window.setInterval(() => {
      setValue((current) => Math.min(100, Math.round(current + Math.random() * 25)));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Progress.Root className={styles.Progress} value={value}>
      <Progress.Label className={styles.Label}>Export data</Progress.Label>
      <Progress.Value className={styles.Value} />
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
import * as React from 'react';
import { Progress } from '@base-ui-components/react/progress';

export default function ExampleProgress() {
  const [value, setValue] = React.useState(20);

  // Simulate changes
  React.useEffect(() => {
    const interval = window.setInterval(() => {
      setValue((current) => Math.min(100, Math.round(current + Math.random() * 25)));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Progress.Root className="grid w-48 grid-cols-2 gap-y-2" value={value}>
      <Progress.Label className="text-sm font-medium text-gray-900">Export data</Progress.Label>
      <Progress.Value className="col-start-2 text-right text-sm text-gray-900" />
      <Progress.Track className="col-span-full h-1 overflow-hidden rounded bg-gray-200 shadow-[inset_0_0_0_1px] shadow-gray-200">
        <Progress.Indicator className="block bg-gray-500 transition-all duration-500" />
      </Progress.Track>
    </Progress.Root>
  );
}
```

## API reference

Import the component and assemble its parts:

```jsx title="Anatomy"
import { Progress } from '@base-ui-components/react/progress';

<Progress.Root>
  <Progress.Label />
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

| Prop             | Type                                                                        | Default | Description                                                                                                                                                                                  |
| :--------------- | :-------------------------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| value            | `number \| null`                                                            | `null`  | The current value. The component is indeterminate when value is `null`.                                                                                                                      |
| getAriaValueText | `((formattedValue: string \| null, value: number \| null) => string)`       | -       | Accepts a function which returns a string value that provides a human-readable text alternative for the current value of the progress bar.                                                   |
| locale           | `LocalesArgument`                                                           | -       | The locale used by `Intl.NumberFormat` when formatting the value.&#xA;Defaults to the user's runtime locale.                                                                                 |
| min              | `number`                                                                    | `0`     | The minimum value.                                                                                                                                                                           |
| max              | `number`                                                                    | `100`   | The maximum value.                                                                                                                                                                           |
| format           | `NumberFormatOptions`                                                       | -       | Options to format the value.                                                                                                                                                                 |
| className        | `string \| ((state: State) => string)`                                      | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render           | `ReactElement \| ((props: GenericHTMLProps, state: State) => ReactElement)` | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

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

| Prop      | Type                                                                        | Default | Description                                                                                                                                                                                  |
| :-------- | :-------------------------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| className | `string \| ((state: State) => string)`                                      | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render    | `ReactElement \| ((props: GenericHTMLProps, state: State) => ReactElement)` | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

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

| Prop      | Type                                                                        | Default | Description                                                                                                                                                                                  |
| :-------- | :-------------------------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| className | `string \| ((state: State) => string)`                                      | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render    | `ReactElement \| ((props: GenericHTMLProps, state: State) => ReactElement)` | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

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

| Prop      | Type                                                                             | Default | Description                                                                                                                                                                                  |
| :-------- | :------------------------------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| children  | `((formattedValue: string \| null, value: number \| null) => ReactNode) \| null` | -       | -                                                                                                                                                                                            |
| className | `string \| ((state: State) => string)`                                           | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render    | `ReactElement \| ((props: GenericHTMLProps, state: State) => ReactElement)`      | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

**Value Data Attributes:**

| Attribute          | Type | Description                                        |
| :----------------- | :--- | :------------------------------------------------- |
| data-complete      | -    | Present when the progress has completed.           |
| data-indeterminate | -    | Present when the progress is in interminate state. |
| data-progressing   | -    | Present while the progress is progressing.         |

### Label

An accessible label for the progress bar.
Renders a `<span>` element.

**Label Props:**

| Prop      | Type                                                                        | Default | Description                                                                                                                                                                                  |
| :-------- | :-------------------------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| className | `string \| ((state: State) => string)`                                      | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render    | `ReactElement \| ((props: GenericHTMLProps, state: State) => ReactElement)` | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

**Label Data Attributes:**

| Attribute          | Type | Description                                        |
| :----------------- | :--- | :------------------------------------------------- |
| data-complete      | -    | Present when the progress has completed.           |
| data-indeterminate | -    | Present when the progress is in interminate state. |
| data-progressing   | -    | Present while the progress is progressing.         |
