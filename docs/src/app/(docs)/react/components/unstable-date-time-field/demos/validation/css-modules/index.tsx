'use client';
import * as React from 'react';
import { subDays } from 'date-fns/subDays';
import { addDays } from 'date-fns/addDays';
import { format } from 'date-fns/format';
import { Field } from '@base-ui/react/field';
import { Form } from '@base-ui/react/form';
import { DateTimeField } from '@base-ui/react/date-time-field';
import fieldStyles from '../../date-time-field.module.css';
import styles from './index.module.css';

const today = new Date();
const minDate = subDays(today, 7);
const maxDate = addDays(today, 7);

export default function ExampleDateTimeFieldValidation() {
  return (
    <Form
      className={styles.Form}
      onFormSubmit={(formData) => {
        // eslint-disable-next-line no-alert
        alert(`Submitted: ${formData.datetime}`);
      }}
    >
      <Field.Root name="datetime" className={fieldStyles.Field}>
        <Field.Label className={fieldStyles.Label}>
          Date and time (between {format(minDate, 'MMM d')} and {format(maxDate, 'MMM d, yyyy')})
        </Field.Label>
        <DateTimeField.Root className={fieldStyles.Root} minDate={minDate} maxDate={maxDate}>
          {(section) => (
            <DateTimeField.Section
              key={section.index}
              className={fieldStyles.Section}
              section={section}
            />
          )}
        </DateTimeField.Root>
        <Field.Error match="rangeUnderflow" className={styles.Error}>
          Date must be on or after {format(minDate, 'MMM d, yyyy')}
        </Field.Error>
        <Field.Error match="rangeOverflow" className={styles.Error}>
          Date must be on or before {format(maxDate, 'MMM d, yyyy')}
        </Field.Error>
      </Field.Root>
      <button type="submit" className={styles.Button}>
        Submit
      </button>
    </Form>
  );
}
