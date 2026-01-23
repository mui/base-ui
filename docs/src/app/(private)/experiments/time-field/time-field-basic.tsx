'use client';
import * as React from 'react';
import { Field } from '@base-ui/react/field';
import { TimeField } from '@base-ui/react/time-field';
import styles from '../date-field/date-field.module.css';

export default function TimeFieldBasic() {
  return (
    <div className={styles.Form}>
      <Field.Root name="time-field-basic" className={styles.Field}>
        <Field.Label className={styles.Label}>Basic</Field.Label>
        <TimeField.Root className={styles.Root}>
          <TimeField.Input className={styles.Input}>
            {(section) => (
              <TimeField.Section key={section.index} className={styles.Section} section={section} />
            )}
          </TimeField.Input>
        </TimeField.Root>
      </Field.Root>
      <Field.Root name="time-field-step" className={styles.Field}>
        <Field.Label className={styles.Label}>Step 5</Field.Label>
        <TimeField.Root className={styles.Root} step={5}>
          <TimeField.Input className={styles.Input}>
            {(section) => (
              <TimeField.Section key={section.index} className={styles.Section} section={section} />
            )}
          </TimeField.Input>
        </TimeField.Root>
      </Field.Root>
      <Field.Root name="time-field-24h" className={styles.Field}>
        <Field.Label className={styles.Label}>Forced 24h clock</Field.Label>
        <TimeField.Root className={styles.Root} step={5} ampm={false}>
          <TimeField.Input className={styles.Input}>
            {(section) => (
              <TimeField.Section key={section.index} className={styles.Section} section={section} />
            )}
          </TimeField.Input>
        </TimeField.Root>
      </Field.Root>
      <Field.Root name="time-field-seconds" className={styles.Field}>
        <Field.Label className={styles.Label}>With seconds</Field.Label>
        <TimeField.Root className={styles.Root} step={5} format="hh:mm:ss aa">
          <TimeField.Input className={styles.Input}>
            {(section) => (
              <TimeField.Section key={section.index} className={styles.Section} section={section} />
            )}
          </TimeField.Input>
        </TimeField.Root>
      </Field.Root>
    </div>
  );
}
