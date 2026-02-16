'use client';
import * as React from 'react';
import { Field } from '@base-ui/react/field';
import { TimeField } from '@base-ui/react/time-field';
import fieldStyles from '../../time-field.module.css';
import styles from './index.module.css';

export default function ExampleTimeFieldCustomFormat() {
  return (
    <div className={styles.Wrapper}>
      <Field.Root className={fieldStyles.Field}>
        <Field.Label className={fieldStyles.Label}>Default format</Field.Label>
        <TimeField.Root className={fieldStyles.Root}>
          {(section) => (
            <TimeField.Section
              key={section.index}
              className={fieldStyles.Section}
              section={section}
            />
          )}
        </TimeField.Root>
      </Field.Root>
      <Field.Root className={fieldStyles.Field}>
        <Field.Label className={fieldStyles.Label}>12-hour with seconds</Field.Label>
        <TimeField.Root className={fieldStyles.Root} format="hh:mm:ss aa">
          {(section) => (
            <TimeField.Section
              key={section.index}
              className={fieldStyles.Section}
              section={section}
            />
          )}
        </TimeField.Root>
      </Field.Root>
      <Field.Root className={fieldStyles.Field}>
        <Field.Label className={fieldStyles.Label}>24-hour with seconds</Field.Label>
        <TimeField.Root className={fieldStyles.Root} format="HH:mm:ss">
          {(section) => (
            <TimeField.Section
              key={section.index}
              className={fieldStyles.Section}
              section={section}
            />
          )}
        </TimeField.Root>
      </Field.Root>
    </div>
  );
}
