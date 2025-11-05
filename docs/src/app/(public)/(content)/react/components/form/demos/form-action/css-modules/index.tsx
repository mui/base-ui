'use client';
import * as React from 'react';
import { Field } from '@base-ui-components/react/field';
import { Form } from '@base-ui-components/react/form';
import styles from './index.module.css';

import { submitForm } from '../submitForm';

interface FormState {
  success: boolean;
  serverErrors?: Form.Props['errors'];
}

export default function ActionStateForm() {
  const [state, formAction, loading] = React.useActionState<FormState, FormData>(submitForm, {
    success: false,
  });

  return (
    <Form className={styles.Form} errors={state.serverErrors} action={formAction}>
      <Field.Root name="username" className={styles.Field}>
        <Field.Label className={styles.Label}>Username</Field.Label>
        <Field.Control
          type="username"
          required
          defaultValue=""
          placeholder="e.g. alice132"
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
