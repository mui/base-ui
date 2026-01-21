'use client';
import * as React from 'react';
import { startOfDay } from 'date-fns/startOfDay';
import { Field } from '@base-ui/react/field';
import { DateField } from '@base-ui/react/date-field';
import styles from './date-field.module.css';

const minDate = startOfDay(new Date());

export default function DateFieldForm() {
  return (
    <React.Fragment>
      <Field.Root name="date-field-basic" className={styles.Field}>
        <Field.Label className={styles.Label}>Basic</Field.Label>
        <DateField.Root className={styles.Root} required>
          <DateField.Input className={styles.Input}>
            {(section) => (
              <DateField.Section key={section.index} className={styles.Section} section={section} />
            )}
          </DateField.Input>
        </DateField.Root>
        <Field.Error className={styles.Error} />
      </Field.Root>
      <Field.Root name="date-field-minDate" className={styles.Field}>
        <Field.Label className={styles.Label}>With min date</Field.Label>
        <DateField.Root className={styles.Root} required minDate={minDate}>
          <DateField.Input className={styles.Input}>
            {(section) => (
              <DateField.Section key={section.index} className={styles.Section} section={section} />
            )}
          </DateField.Input>
        </DateField.Root>
        <Field.Error className={styles.Error} />
      </Field.Root>
    </React.Fragment>
  );
}
