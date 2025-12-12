'use client';

import * as React from 'react';
import { Field } from '@base-ui-components/react/field';
import { Form } from '@base-ui-components/react/form';
import { Textarea } from '@base-ui-components/react/textarea';
import styles from './index.module.css';

export default function ExampleForm() {
  const [errors, setErrors] = React.useState({});
  const [loading, setLoading] = React.useState(false);

  return (
    <Form
      className={styles.Form}
      errors={errors}
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
      <Field.Root name="feedback" className={styles.Field}>
        <Field.Label className={styles.Label}>Feedback</Field.Label>
        <Textarea placeholder="Enter your feedback" className={styles.Textarea} />
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
    if (value.length < 10) {
      return { error: 'Feedback must be at least 10 characters long' };
    }
  } catch {
    return { error: 'Invalid feedback' };
  }

  return { success: true };
}
