import * as React from 'react';
import { Field } from '@base-ui-components/react/field';
import styles from './index.module.css';

export default function ExampleField() {
  return (
    <Field.Root className={styles.Field}>
      <Field.Label className={styles.Label}>Name</Field.Label>
      <Field.Control
        required
        // @ts-expect-error
        placeholder="Required"
        className={styles.TextInput}
      />

      <Field.Error className={styles.Error} match="valueMissing">
        Please enter your name
      </Field.Error>

      <Field.Description className={styles.Description}>
        Visible on your profile
      </Field.Description>
    </Field.Root>
  );
}
