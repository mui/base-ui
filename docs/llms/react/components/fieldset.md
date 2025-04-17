---
title: Fieldset
subtitle: A native fieldset element with an easily stylable legend.
description: A high-quality, unstyled React fieldset component with an easily stylable legend.
---
# Fieldset

A high-quality, unstyled React fieldset component with an easily stylable legend.

## Demo

### CSS Modules

This example shows how to implement the component using CSS Modules.

```css
/* index.module.css */
.Fieldset {
  border: 0;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  max-width: 16rem;
}

.Legend {
  border-bottom: 1px solid var(--color-gray-200);
  padding-bottom: 0.75rem;
  font-weight: 500;
  font-size: 1.125rem;
  line-height: 1.75rem;
  letter-spacing: -0.0025em;
  color: var(--color-gray-900);
}

.Field {
  display: flex;
  flex-direction: column;
  align-items: start;
  gap: 0.25rem;
}

.Label {
  font-size: 0.875rem;
  line-height: 1.25rem;
  font-weight: 500;
  color: var(--color-gray-900);
}

.Input {
  box-sizing: border-box;
  padding-left: 0.875rem;
  margin: 0;
  border: 1px solid var(--color-gray-200);
  width: 100%;
  height: 2.5rem;
  border-radius: 0.375rem;
  font-family: inherit;
  font-size: 1rem;
  background-color: transparent;
  color: var(--color-gray-900);

  &:focus {
    outline: 2px solid var(--color-blue);
    outline-offset: -1px;
  }
}

.Error {
  font-size: 0.875rem;
  line-height: 1.25rem;
  color: var(--color-red-800);
}

.Description {
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.25rem;
  color: var(--color-gray-600);
}
```

```tsx
/* index.tsx */
import * as React from 'react';
import { Field } from '@base-ui-components/react/field';
import { Fieldset } from '@base-ui-components/react/fieldset';
import styles from './index.module.css';

export default function ExampleField() {
  return (
    <Fieldset.Root className={styles.Fieldset}>
      <Fieldset.Legend className={styles.Legend}>Billing details</Fieldset.Legend>

      <Field.Root className={styles.Field}>
        <Field.Label className={styles.Label}>Company</Field.Label>
        <Field.Control placeholder="Enter company name" className={styles.Input} />
      </Field.Root>

      <Field.Root className={styles.Field}>
        <Field.Label className={styles.Label}>Tax ID</Field.Label>
        <Field.Control placeholder="Enter fiscal number" className={styles.Input} />
      </Field.Root>
    </Fieldset.Root>
  );
}
```

### Tailwind

This example shows how to implement the component using Tailwind CSS.

```tsx
/* index.tsx */
import * as React from 'react';
import { Field } from '@base-ui-components/react/field';
import { Fieldset } from '@base-ui-components/react/fieldset';

export default function ExampleField() {
  return (
    <Fieldset.Root className="flex w-full max-w-64 flex-col gap-4">
      <Fieldset.Legend className="border-b border-gray-200 pb-3 text-lg font-medium text-gray-900">
        Billing details
      </Fieldset.Legend>

      <Field.Root className="flex flex-col items-start gap-1">
        <Field.Label className="text-sm font-medium text-gray-900">Company</Field.Label>
        <Field.Control
          placeholder="Enter company name"
          className="h-10 w-full rounded-md border border-gray-200 pl-3.5 text-base text-gray-900 focus:outline focus:outline-2 focus:-outline-offset-1 focus:outline-blue-800"
        />
      </Field.Root>

      <Field.Root className="flex flex-col items-start gap-1">
        <Field.Label className="text-sm font-medium text-gray-900">Tax ID</Field.Label>
        <Field.Control
          placeholder="Enter fiscal number"
          className="h-10 w-full rounded-md border border-gray-200 pl-3.5 text-base text-gray-900 focus:outline focus:outline-2 focus:-outline-offset-1 focus:outline-blue-800"
        />
      </Field.Root>
    </Fieldset.Root>
  );
}
```

## API reference

Import the component and assemble its parts:

```jsx title="Anatomy"
import { Fieldset } from '@base-ui-components/react/fieldset';

<Fieldset.Root>
  <Fieldset.Legend />
</Fieldset.Root>;
```

### Root

Groups the fieldset legend and the associated fields.
Renders a `<fieldset>` element.

**Root Props:**

| Prop      | Type                                                                        | Default | Description                                                                                                                                                                                  |
| :-------- | :-------------------------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| className | `string \| ((state: State) => string)`                                      | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render    | `ReactElement \| ((props: GenericHTMLProps, state: State) => ReactElement)` | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

### Legend

An accessible label that is automatically associated with the fieldset.
Renders a `<div>` element.

**Legend Props:**

| Prop      | Type                                                                        | Default | Description                                                                                                                                                                                  |
| :-------- | :-------------------------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| className | `string \| ((state: State) => string)`                                      | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render    | `ReactElement \| ((props: GenericHTMLProps, state: State) => ReactElement)` | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |
