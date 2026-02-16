'use client';
import * as React from 'react';
import { Field } from '@base-ui/react/field';
import { DateTimeField } from '@base-ui/react/date-time-field';
import styles from '../../date-time-field.module.css';

export default function ExampleDateTimeFieldClearButton() {
  return (
    <Field.Root className={styles.Field}>
      <Field.Label className={styles.Label}>Date and time</Field.Label>
      <DateTimeField.Root className={styles.Root}>
        <DateTimeField.SectionList>
          {(section) => (
            <DateTimeField.Section
              key={section.index}
              className={styles.Section}
              section={section}
            />
          )}
        </DateTimeField.SectionList>
        <DateTimeField.Clear className={styles.Clear}>{'\u2715'}</DateTimeField.Clear>
      </DateTimeField.Root>
    </Field.Root>
  );
}
