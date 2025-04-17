---
title: Checkbox Group
subtitle: Provides shared state to a series of checkboxes.
description: A high-quality, unstyled React checkbox group component that provides a shared state for a series of checkboxes.
---
# Checkbox Group

A high-quality, unstyled React checkbox group component that provides a shared state for a series of checkboxes.

## Demo

### CSS Modules

This example shows how to implement the component using CSS Modules.

```css
/* index.module.css */
.CheckboxGroup {
  display: flex;
  flex-direction: column;
  align-items: start;
  gap: 0.25rem;
  color: var(--color-gray-900);
}

.Caption {
  font-weight: 500;
}

.Item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
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
import * as React from "react";
import { Checkbox } from "@base-ui-components/react/checkbox";
import { CheckboxGroup } from "@base-ui-components/react/checkbox-group";
import styles from "./index.module.css";

export default function ExampleCheckboxGroup() {
  return (
    <CheckboxGroup
      aria-labelledby="apples-caption"
      defaultValue={["fuji-apple"]}
      className={styles.CheckboxGroup}
    >
      <div className={styles.Caption} id="apples-caption">
        Apples
      </div>

      <label className={styles.Item}>
        <Checkbox.Root name="fuji-apple" className={styles.Checkbox}>
          <Checkbox.Indicator className={styles.Indicator}>
            <CheckIcon className={styles.Icon} />
          </Checkbox.Indicator>
        </Checkbox.Root>
        Fuji
      </label>

      <label className={styles.Item}>
        <Checkbox.Root name="gala-apple" className={styles.Checkbox}>
          <Checkbox.Indicator className={styles.Indicator}>
            <CheckIcon className={styles.Icon} />
          </Checkbox.Indicator>
        </Checkbox.Root>
        Gala
      </label>

      <label className={styles.Item}>
        <Checkbox.Root name="granny-smith-apple" className={styles.Checkbox}>
          <Checkbox.Indicator className={styles.Indicator}>
            <CheckIcon className={styles.Icon} />
          </Checkbox.Indicator>
        </Checkbox.Root>
        Granny Smith
      </label>
    </CheckboxGroup>
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
import { Checkbox } from "@base-ui-components/react/checkbox";
import { CheckboxGroup } from "@base-ui-components/react/checkbox-group";

export default function ExampleCheckboxGroup() {
  return (
    <CheckboxGroup
      aria-labelledby="apples-caption"
      defaultValue={["fuji-apple"]}
      className="flex flex-col items-start gap-1 text-gray-900"
    >
      <div className="font-medium" id="apples-caption">
        Apples
      </div>

      <label className="flex items-center gap-2">
        <Checkbox.Root
          name="fuji-apple"
          className="flex size-5 items-center justify-center rounded-sm outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800 data-[checked]:bg-gray-900 data-[unchecked]:border data-[unchecked]:border-gray-300"
        >
          <Checkbox.Indicator className="flex text-gray-50 data-[unchecked]:hidden">
            <CheckIcon className="size-3" />
          </Checkbox.Indicator>
        </Checkbox.Root>
        Fuji
      </label>

      <label className="flex items-center gap-2">
        <Checkbox.Root
          name="gala-apple"
          className="flex size-5 items-center justify-center rounded-sm outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800 data-[checked]:bg-gray-900 data-[unchecked]:border data-[unchecked]:border-gray-300"
        >
          <Checkbox.Indicator className="flex text-gray-50 data-[unchecked]:hidden">
            <CheckIcon className="size-3" />
          </Checkbox.Indicator>
        </Checkbox.Root>
        Gala
      </label>

      <label className="flex items-center gap-2">
        <Checkbox.Root
          name="granny-smith-apple"
          className="flex size-5 items-center justify-center rounded-sm outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800 data-[checked]:bg-gray-900 data-[unchecked]:border data-[unchecked]:border-gray-300"
        >
          <Checkbox.Indicator className="flex text-gray-50 data-[unchecked]:hidden">
            <CheckIcon className="size-3" />
          </Checkbox.Indicator>
        </Checkbox.Root>
        Granny Smith
      </label>
    </CheckboxGroup>
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

Checkbox Group is composed together with [Checkbox](/react/components/checkbox). Import the components and place them together:

```jsx title="Anatomy"
import { Checkbox } from "@base-ui-components/react/checkbox";
import { CheckboxGroup } from "@base-ui-components/react/checkbox-group";

<CheckboxGroup>
  <Checkbox.Root />
</CheckboxGroup>;
```

Provides a shared state to a series of checkboxes.

**CheckboxGroup Props:**

| Prop          | Type                                                         | Default | Description                                                                                                                                                                                  |
| :------------ | :----------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| defaultValue  | `string[]`                                                   | -       | Names of the checkboxes in the group that should be initially ticked.To render a controlled checkbox group, use the `value` prop instead.                                                    |
| value         | `string[]`                                                   | -       | Names of the checkboxes in the group that should be ticked.To render an uncontrolled checkbox group, use the `defaultValue` prop instead.                                                    |
| onValueChange | `(value, event) => void`                                     | -       | Event handler called when a checkbox in the group is ticked or unticked.&#xA;Provides the new value as an argument.                                                                          |
| allValues     | `string[]`                                                   | -       | Names of all checkboxes in the group. Use this when creating a parent checkbox.                                                                                                              |
| disabled      | `boolean`                                                    | `false` | Whether the component should ignore user interaction.                                                                                                                                        |
| className     | `string \| (state) => string`                                | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render        | `React.ReactElement \| (props, state) => React.ReactElement` | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

**CheckboxGroup Data Attributes:**

| Attribute     | Type | Description                                  |
| :------------ | :--- | :------------------------------------------- |
| data-disabled | -    | Present when the checkbox group is disabled. |
