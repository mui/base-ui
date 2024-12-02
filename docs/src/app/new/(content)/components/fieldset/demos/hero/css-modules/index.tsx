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
        <Field.Control
          // @ts-expect-error
          placeholder="Enter company name"
          className={styles.TextInput}
        />
      </Field.Root>

      <Field.Root className={styles.Field}>
        <Field.Label className={styles.Label}>Tax ID</Field.Label>
        <Field.Control
          // @ts-expect-error
          placeholder="Enter fiscal number"
          className={styles.TextInput}
        />
      </Field.Root>
    </Fieldset.Root>
  );
}
