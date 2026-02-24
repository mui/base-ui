'use client';
import * as React from 'react';
import { Field } from '@base-ui/react/field';
import { DateField } from '@base-ui/react/date-field';
import styles from '../../date-field.module.css';

export default function ExampleDateField() {
  return (
    <Field.Root className={styles.Field}>
      <Field.Label className={styles.Label}>Date</Field.Label>
      <DateField.Root className={styles.Root}>
        {(section) => (
          <DateField.Section key={section.index} className={styles.Section} section={section} />
        )}
      </DateField.Root>
    </Field.Root>
  );
}
