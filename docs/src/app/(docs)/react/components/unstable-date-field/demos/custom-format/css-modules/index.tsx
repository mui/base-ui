'use client';
import * as React from 'react';
import { Field } from '@base-ui/react/field';
import { DateField } from '@base-ui/react/date-field';
import fieldStyles from '../../date-field.module.css';
import styles from './index.module.css';

export default function ExampleDateFieldCustomFormat() {
  return (
    <div className={styles.Wrapper}>
      <Field.Root className={fieldStyles.Field}>
        <Field.Label className={fieldStyles.Label}>Default (numeric)</Field.Label>
        <DateField.Root className={fieldStyles.Root}>
          {(section) => (
            <DateField.Section
              key={section.index}
              className={fieldStyles.Section}
              section={section}
            />
          )}
        </DateField.Root>
      </Field.Root>
      <Field.Root className={fieldStyles.Field}>
        <Field.Label className={fieldStyles.Label}>With weekday</Field.Label>
        <DateField.Root className={fieldStyles.Root} format="EEEE, MMMM dd, yyyy">
          {(section) => (
            <DateField.Section
              key={section.index}
              className={fieldStyles.Section}
              section={section}
            />
          )}
        </DateField.Root>
      </Field.Root>
      <Field.Root className={fieldStyles.Field}>
        <Field.Label className={fieldStyles.Label}>ISO format</Field.Label>
        <DateField.Root className={fieldStyles.Root} format="yyyy-MM-dd">
          {(section) => (
            <DateField.Section
              key={section.index}
              className={fieldStyles.Section}
              section={section}
            />
          )}
        </DateField.Root>
      </Field.Root>
    </div>
  );
}
