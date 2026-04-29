'use client';
import * as React from 'react';
import { Field } from '@base-ui/react/field';
import { Form } from '@base-ui/react/form';
import { Button } from '@base-ui/react/button';

export default function ExampleForm() {
  const [errors, setErrors] = React.useState({});
  const [loading, setLoading] = React.useState(false);

  return (
    <Form
      className="flex w-full max-w-64 flex-col gap-4"
      errors={errors}
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
        <Field.Label className="text-sm font-bold text-neutral-950 dark:text-white">
          Homepage
        </Field.Label>
        <Field.Control
          type="url"
          required
          defaultValue="https://example.com"
          placeholder="https://example.com"
          pattern="https?://.*"
          className="h-8 w-full border border-neutral-950 bg-transparent px-2 text-sm font-normal text-neutral-950 placeholder:text-neutral-500 focus:outline-2 focus:-outline-offset-2 focus:outline-blue-800 dark:border-white dark:text-white dark:placeholder:text-neutral-400"
        />
        <Field.Error className="text-sm text-red-700 dark:text-red-400" />
      </Field.Root>
      <Button
        disabled={loading}
        focusableWhenDisabled
        type="submit"
        className="flex h-8 items-center justify-center rounded-none border border-neutral-950 bg-white px-3 text-sm font-normal text-neutral-950 select-none hover:not-data-disabled:bg-neutral-50 active:not-data-disabled:bg-neutral-100 data-disabled:text-neutral-500 dark:border-white dark:bg-neutral-950 dark:text-white dark:hover:not-data-disabled:bg-neutral-900 dark:active:not-data-disabled:bg-neutral-800 dark:data-disabled:text-neutral-400 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-800"
      >
        Submit
      </Button>
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
