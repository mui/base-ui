'use client';
import * as React from 'react';
import { set } from 'date-fns/set';
import { format } from 'date-fns/format';
import { Field } from '@base-ui/react/field';
import { Form } from '@base-ui/react/form';
import { TimeField } from '@base-ui/react/time-field';
import fieldStyles from '../../time-field.module.css';
import styles from './index.module.css';

const today = new Date();
const minDate = set(today, { hours: 9, minutes: 0, seconds: 0 });
const maxDate = set(today, { hours: 17, minutes: 30, seconds: 0 });

export default function ExampleTimeFieldValidation() {
  return (
    <Form
      className={styles.Form}
      onFormSubmit={(formData) => {
        // eslint-disable-next-line no-alert
        alert(`Submitted: ${formData.time}`);
      }}
    >
      <Field.Root name="time" className={fieldStyles.Field}>
        <Field.Label className={fieldStyles.Label}>
          Time (between {format(minDate, 'h:mm a')} and {format(maxDate, 'h:mm a')})
        </Field.Label>
        <TimeField.Root className={fieldStyles.Root} minDate={minDate} maxDate={maxDate}>
          {(section) => (
            <TimeField.Section
              key={section.index}
              className={fieldStyles.Section}
              section={section}
            />
          )}
        </TimeField.Root>
        <Field.Error match="rangeUnderflow" className={styles.Error}>
          Time must be on or after {format(minDate, 'h:mm a')}
        </Field.Error>
        <Field.Error match="rangeOverflow" className={styles.Error}>
          Time must be on or before {format(maxDate, 'h:mm a')}
        </Field.Error>
      </Field.Root>
      <button type="submit" className={styles.Button}>
        Submit
      </button>
    </Form>
  );
}
