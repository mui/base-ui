import * as React from 'react';
import { Field } from '@base-ui-components/react/field';
import { Form } from '@base-ui-components/react/form';
import styles from './index.module.css';

interface FormState {
  success: boolean;
  serverErrors: { [fieldName: string]: string | undefined };
}

export default function ActionStateForm() {
  const [state, formAction, loading] = React.useActionState<FormState, FormData>(submitForm, {
    success: false,
    serverErrors: {},
  });

  return (
    <Form className={styles.Form} action={formAction}>
      <Field.Root name="username" className={styles.Field}>
        <Field.Label className={styles.Label}>Username</Field.Label>
        <Field.Control
          type="username"
          required
          defaultValue="admin"
          placeholder="e.g. alice132"
          className={styles.Input}
        />
        <Field.Error className={styles.Error} />

        <Field.Error match={!!state.serverErrors.username}>
          {state.serverErrors.username}
        </Field.Error>
      </Field.Root>
      <button disabled={loading} type="submit" className={styles.Button}>
        Submit
      </button>
    </Form>
  );
}

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
        success: false,
        serverErrors: { username: `${username} is unavailable` },
      };
    }
  } catch {
    return { success: false, serverErrors: { username: 'A server error has occurred' } };
  }

  return { success: true, serverErrors: {} };
}
