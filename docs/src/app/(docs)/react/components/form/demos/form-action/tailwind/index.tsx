'use client';
import * as React from 'react';
import { Field } from '@base-ui/react/field';
import { Form } from '@base-ui/react/form';
import { Button } from '@base-ui/react/button';

interface FormState {
  serverErrors?: Form.Props['errors'];
}

export default function ActionStateForm() {
  const [state, formAction, loading] = React.useActionState<FormState, FormData>(submitForm, {});

  return (
    <Form
      action={formAction}
      errors={state.serverErrors}
      className="flex w-full max-w-64 flex-col gap-4"
    >
      <Field.Root name="username" className="flex flex-col items-start gap-1">
        <Field.Label className="text-sm font-bold text-neutral-950 dark:text-white">
          Username
        </Field.Label>
        <Field.Control
          type="username"
          required
          defaultValue="admin"
          placeholder="e.g. alice132"
          className="h-8 w-full border border-neutral-950 bg-transparent px-2 text-sm font-normal text-neutral-950 placeholder:text-neutral-500 focus:outline-2 focus:-outline-offset-2 focus:outline-blue-800 dark:border-white dark:text-white dark:placeholder:text-neutral-400"
        />
        <Field.Error className="text-sm text-red-700 dark:text-red-400" />
      </Field.Root>
      <Button
        type="submit"
        disabled={loading}
        focusableWhenDisabled
        className="flex h-8 items-center justify-center rounded-none border border-neutral-950 bg-white px-3 text-sm font-normal text-neutral-950 select-none hover:not-data-disabled:bg-neutral-50 active:not-data-disabled:bg-neutral-100 data-disabled:text-neutral-500 dark:border-white dark:bg-neutral-950 dark:text-white dark:hover:not-data-disabled:bg-neutral-900 dark:active:not-data-disabled:bg-neutral-800 dark:data-disabled:text-neutral-400 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-800"
      >
        Submit
      </Button>
    </Form>
  );
}

// Mark this as a Server Function with `'use server'` in a supporting framework like Next.js
async function submitForm(_previousState: FormState, formData: FormData) {
  // Mimic a server response
  await new Promise((resolve) => {
    setTimeout(resolve, 1000);
  });

  try {
    const username = formData.get('username') as string | null;

    if (username === 'admin') {
      return { success: false, serverErrors: { username: "'admin' is reserved for system use" } };
    }

    // 50% chance the username is taken
    const success = Math.random() > 0.5;

    if (!success) {
      return {
        serverErrors: { username: `${username} is unavailable` },
      };
    }
  } catch {
    return { serverErrors: { username: 'A server error has occurred' } };
  }

  return {};
}
