'use client';
import * as React from 'react';
import { Field } from '@base-ui/react/field';
import { DateField } from '@base-ui/react/date-field';
import styles from '../../date-field.module.css';

export default function ExampleDateFieldClearButton() {
  return (
    <Field.Root className={styles.Field}>
      <Field.Label className={styles.Label}>Date</Field.Label>
      <DateField.Root className={styles.Root}>
        <DateField.SectionList>
          {(section) => (
            <DateField.Section key={section.index} className={styles.Section} section={section} />
          )}
        </DateField.SectionList>
        <DateField.Clear className={styles.Clear}>{'\u2715'}</DateField.Clear>
      </DateField.Root>
    </Field.Root>
  );
}
