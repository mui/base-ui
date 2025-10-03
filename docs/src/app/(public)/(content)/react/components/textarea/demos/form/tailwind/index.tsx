import * as React from 'react';
import { Field } from '@base-ui-components/react/field';
import { Form } from '@base-ui-components/react/form';
import { Textarea } from '@base-ui-components/react/textarea';

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
        const value = formData.get('feedback') as string;

        setLoading(true);
        const response = await submitForm(value);
        const serverErrors = {
          feedback: response.error,
        };

        setErrors(serverErrors);
        setLoading(false);
      }}
    >
      <Field.Root name="feedback" className="flex flex-col items-start gap-1">
        <Field.Label className="text-sm font-medium text-gray-900">Feedback</Field.Label>
        <Textarea
          placeholder="Enter your feedback"
          className="field-sizing-content min-h-16 w-full max-w-64 resize-y rounded-md border border-gray-200 px-3 py-2 text-base text-gray-900 focus:outline-2 focus:-outline-offset-1 focus:outline-blue-800"
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
    if (value.length < 10) {
      return { error: 'Feedback must be at least 10 characters long' };
    }
  } catch {
    return { error: 'Invalid feedback' };
  }

  return { success: true };
}
