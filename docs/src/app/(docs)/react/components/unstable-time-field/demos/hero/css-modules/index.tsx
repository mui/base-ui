'use client';
import * as React from 'react';
import { Field } from '@base-ui/react/field';
import { TimeField } from '@base-ui/react/time-field';
import styles from '../../time-field.module.css';

export default function ExampleTimeField() {
  return (
    <Field.Root className={styles.Field}>
      <Field.Label className={styles.Label}>Time</Field.Label>
      <TimeField.Root className={styles.Root}>
        {(section) => (
          <TimeField.Section key={section.index} className={styles.Section} section={section} />
        )}
      </TimeField.Root>
    </Field.Root>
  );
}
