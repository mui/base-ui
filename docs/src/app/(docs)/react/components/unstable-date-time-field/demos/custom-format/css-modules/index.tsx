'use client';
import * as React from 'react';
import { Field } from '@base-ui/react/field';
import { DateTimeField } from '@base-ui/react/date-time-field';
import fieldStyles from '../../date-time-field.module.css';
import styles from './index.module.css';

export default function ExampleDateTimeFieldCustomFormat() {
  return (
    <div className={styles.Wrapper}>
      <Field.Root className={fieldStyles.Field}>
        <Field.Label className={fieldStyles.Label}>Default format</Field.Label>
        <DateTimeField.Root className={fieldStyles.Root}>
          {(section) => (
            <DateTimeField.Section
              key={section.index}
              className={fieldStyles.Section}
              section={section}
            />
          )}
        </DateTimeField.Root>
      </Field.Root>
      <Field.Root className={fieldStyles.Field}>
        <Field.Label className={fieldStyles.Label}>ISO-like format</Field.Label>
        <DateTimeField.Root className={fieldStyles.Root} format="yyyy-MM-dd HH:mm">
          {(section) => (
            <DateTimeField.Section
              key={section.index}
              className={fieldStyles.Section}
              section={section}
            />
          )}
        </DateTimeField.Root>
      </Field.Root>
      <Field.Root className={fieldStyles.Field}>
        <Field.Label className={fieldStyles.Label}>12-hour with meridiem</Field.Label>
        <DateTimeField.Root className={fieldStyles.Root} format="MM/dd/yyyy hh:mm aa">
          {(section) => (
            <DateTimeField.Section
              key={section.index}
              className={fieldStyles.Section}
              section={section}
            />
          )}
        </DateTimeField.Root>
      </Field.Root>
    </div>
  );
}
