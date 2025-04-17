---
title: Form
subtitle: A native form element with consolidated error handling.
description: A high-quality, unstyled React form component with consolidated error handling.
---
# Form

A high-quality, unstyled React form component with consolidated error handling.

## Demo

### CSS Modules

This example shows how to implement the component using CSS Modules.

```css
/* index.module.css */
.Form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  max-width: 16rem;
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

.Button {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 2.5rem;
  padding: 0 0.875rem;
  margin: 0;
  outline: 0;
  border: 1px solid var(--color-gray-200);
  border-radius: 0.375rem;
  background-color: var(--color-gray-50);
  font-family: inherit;
  font-size: 1rem;
  font-weight: 500;
  line-height: 1.5rem;
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

  &:disabled {
    cursor: not-allowed;
    color: var(--color-gray-400);
    background-color: var(--color-gray-100);
  }

  &:focus-visible {
    outline: 2px solid var(--color-blue);
    outline-offset: -1px;
  }
}
```

```tsx
/* index.tsx */
import * as React from 'react';
import { Field } from '@base-ui-components/react/field';
import { Form } from '@base-ui-components/react/form';
import styles from './index.module.css';

export default function ExampleForm() {
  const [errors, setErrors] = React.useState({});
  const [loading, setLoading] = React.useState(false);

  return (
    <Form
      className={styles.Form}
      errors={errors}
      onClearErrors={setErrors}
      onSubmit={async (event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const value = formData.get('url') as string;

        setLoading(true);
        const response = await submitForm(value);
        const serverErrors = {
          url: response.error,
        };

        setErrors(serverErrors);
        setLoading(false);
      }}
    >
      <Field.Root name="url" className={styles.Field}>
        <Field.Label className={styles.Label}>Homepage</Field.Label>
        <Field.Control
          type="url"
          required
          defaultValue="https://example.com"
          placeholder="https://example.com"
          pattern="https?://.*"
          className={styles.Input}
        />
        <Field.Error className={styles.Error} />
      </Field.Root>
      <button disabled={loading} type="submit" className={styles.Button}>
        Submit
      </button>
    </Form>
  );
}

async function submitForm(value: string) {
  // Mimic a server response
  await new Promise((resolve) => {
    setTimeout(resolve, 1000);
  });

  try {
    const url = new URL(value);

    if (url.hostname.endsWith('example.com')) {
      return { error: 'The example domain is not allowed' };
    }
  } catch {
    return { error: 'This is not a valid URL' };
  }

  return { success: true };
}
```

### Tailwind

This example shows how to implement the component using Tailwind CSS.

```tsx
/* index.tsx */
import * as React from 'react';
import { Field } from '@base-ui-components/react/field';
import { Form } from '@base-ui-components/react/form';

export default function ExampleForm() {
  const [errors, setErrors] = React.useState({});
  const [loading, setLoading] = React.useState(false);

  return (
    <Form
      className="flex w-full max-w-64 flex-col gap-4"
      errors={errors}
      onClearErrors={setErrors}
      onSubmit={async (event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const value = formData.get('url') as string;

        setLoading(true);
        const response = await submitForm(value);
        const serverErrors = {
          url: response.error,
        };

        setErrors(serverErrors);
        setLoading(false);
      }}
    >
      <Field.Root name="url" className="flex flex-col items-start gap-1">
        <Field.Label className="text-sm font-medium text-gray-900">
          Homepage
        </Field.Label>
        <Field.Control
          type="url"
          required
          defaultValue="https://example.com"
          placeholder="https://example.com"
          pattern="https?://.*"
          className="h-10 w-full rounded-md border border-gray-200 pl-3.5 text-base text-gray-900 focus:outline focus:outline-2 focus:-outline-offset-1 focus:outline-blue-800"
        />
        <Field.Error className="text-sm text-red-800" />
      </Field.Root>
      <button
        disabled={loading}
        type="submit"
        className="flex h-10 items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-3.5 text-base font-medium text-gray-900 select-none hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-100 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
      >
        Submit
      </button>
    </Form>
  );
}

async function submitForm(value: string) {
  // Mimic a server response
  await new Promise((resolve) => {
    setTimeout(resolve, 1000);
  });

  try {
    const url = new URL(value);

    if (url.hostname.endsWith('example.com')) {
      return { error: 'The example domain is not allowed' };
    }
  } catch {
    return { error: 'This is not a valid URL' };
  }

  return { success: true };
}
```

## API reference

Form is composed together with [Field](/react/components/field). Import the components and place them together:

```jsx title="Anatomy"
import { Field } from '@base-ui-components/react/field';
import { Form } from '@base-ui-components/react/form';

<Form>
  <Field.Root>
    <Field.Label />
    <Field.Control />
    <Field.Error />
  </Field.Root>
</Form>;
```

A native form element with consolidated error handling.
Renders a `<form>` element.

**Form Props:**

| Prop          | Type                                                                        | Default | Description                                                                                                                                                                                  |
| :------------ | :-------------------------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| errors        | `Errors`                                                                    | -       | An object where the keys correspond to the `name` attribute of the form fields,&#xA;and the values correspond to the error(s) related to that field.                                         |
| onClearErrors | `((errors: Errors) => void)`                                                | -       | Event handler called when the `errors` object is cleared.                                                                                                                                    |
| className     | `string \| ((state: State) => string)`                                      | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render        | `ReactElement \| ((props: GenericHTMLProps, state: State) => ReactElement)` | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

## Examples

### Using with Zod

When parsing the schema using `schema.safeParse()`, the `result.error.flatten().fieldErrors` data can be used to map the errors to each field's `name`.

## Demo

### CSS Modules

This example shows how to implement the component using CSS Modules.

```css
/* index.module.css */
.Form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  max-width: 16rem;
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

.Button {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 2.5rem;
  padding: 0 0.875rem;
  margin: 0;
  outline: 0;
  border: 1px solid var(--color-gray-200);
  border-radius: 0.375rem;
  background-color: var(--color-gray-50);
  font-family: inherit;
  font-size: 1rem;
  font-weight: 500;
  line-height: 1.5rem;
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

  &:disabled {
    cursor: not-allowed;
    color: var(--color-gray-400);
    background-color: var(--color-gray-100);
  }

  &:focus-visible {
    outline: 2px solid var(--color-blue);
    outline-offset: -1px;
  }
}
```

```tsx
/* index.tsx */
import * as React from 'react';
import { z } from 'zod';
import { Field } from '@base-ui-components/react/field';
import { Form } from '@base-ui-components/react/form';
import styles from './index.module.css';

const schema = z.object({
  name: z.string().min(1),
  age: z.coerce.number().positive(),
});

async function submitForm(event: React.FormEvent<HTMLFormElement>) {
  event.preventDefault();

  const formData = new FormData(event.currentTarget);
  const result = schema.safeParse(Object.fromEntries(formData as any));

  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors,
    };
  }

  return {
    errors: {},
  };
}

export default function Page() {
  const [errors, setErrors] = React.useState({});

  return (
    <Form
      className={styles.Form}
      errors={errors}
      onClearErrors={setErrors}
      onSubmit={async (event) => {
        const response = await submitForm(event);
        setErrors(response.errors);
      }}
    >
      <Field.Root name="name" className={styles.Field}>
        <Field.Label className={styles.Label}>Name</Field.Label>
        <Field.Control placeholder="Enter name" className={styles.Input} />
        <Field.Error className={styles.Error} />
      </Field.Root>
      <Field.Root name="age" className={styles.Field}>
        <Field.Label className={styles.Label}>Age</Field.Label>
        <Field.Control placeholder="Enter age" className={styles.Input} />
        <Field.Error className={styles.Error} />
      </Field.Root>
      <button type="submit" className={styles.Button}>
        Submit
      </button>
    </Form>
  );
}
```

### Tailwind

This example shows how to implement the component using Tailwind CSS.

```tsx
/* index.tsx */
import * as React from 'react';
import { z } from 'zod';
import { Field } from '@base-ui-components/react/field';
import { Form } from '@base-ui-components/react/form';

const schema = z.object({
  name: z.string().min(1),
  age: z.coerce.number().positive(),
});

async function submitForm(event: React.FormEvent<HTMLFormElement>) {
  event.preventDefault();

  const formData = new FormData(event.currentTarget);
  const result = schema.safeParse(Object.fromEntries(formData as any));

  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors,
    };
  }

  return {
    errors: {},
  };
}

export default function Page() {
  const [errors, setErrors] = React.useState({});

  return (
    <Form
      className="flex w-full max-w-64 flex-col gap-4"
      errors={errors}
      onClearErrors={setErrors}
      onSubmit={async (event) => {
        const response = await submitForm(event);
        setErrors(response.errors);
      }}
    >
      <Field.Root name="name" className="flex flex-col items-start gap-1">
        <Field.Label className="text-sm font-medium text-gray-900">Name</Field.Label>
        <Field.Control
          placeholder="Enter name"
          className="h-10 w-full rounded-md border border-gray-200 pl-3.5 text-base text-gray-900 focus:outline focus:outline-2 focus:-outline-offset-1 focus:outline-blue-800"
        />
        <Field.Error className="text-sm text-red-800" />
      </Field.Root>
      <Field.Root name="age" className="flex flex-col items-start gap-1">
        <Field.Label className="text-sm font-medium text-gray-900">Age</Field.Label>
        <Field.Control
          placeholder="Enter age"
          className="h-10 w-full rounded-md border border-gray-200 pl-3.5 text-base text-gray-900 focus:outline focus:outline-2 focus:-outline-offset-1 focus:outline-blue-800"
        />
        <Field.Error className="text-sm text-red-800" />
      </Field.Root>
      <button
        type="submit"
        className="flex h-10 items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-3.5 text-base font-medium text-gray-900 select-none hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-100 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
      >
        Submit
      </button>
    </Form>
  );
}
```
