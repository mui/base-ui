'use client';
import * as React from 'react';
import { Field } from '@base-ui/react/field';
import { DateField } from '@base-ui/react/date-field';
import styles from './date-field.module.css';

export default function DateFieldForm() {
  return (
    <Field.Root name="number-field" className={styles.Field}>
      <Field.Label className={styles.Label}>Birth date</Field.Label>
      <DateField.Root className={styles.Root}>
        <DateField.Input className={styles.Input}>
          {(section) => (
            <DateField.Section key={section.index} className={styles.Section} section={section} />
          )}
        </DateField.Input>
      </DateField.Root>
      <Field.Error className={styles.Error} />
    </Field.Root>
  );
}
