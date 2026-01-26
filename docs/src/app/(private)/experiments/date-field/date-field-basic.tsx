'use client';
import * as React from 'react';
import { startOfDay } from 'date-fns/startOfDay';
import { subDays } from 'date-fns/subDays';
import { addDays } from 'date-fns/addDays';
import { format } from 'date-fns/format';
import { Field } from '@base-ui/react/field';
import { Form } from '@base-ui/react/form';
import { DateField } from '@base-ui/react/date-field';
import styles from './date-field.module.css';

const today = startOfDay(new Date());
const minDate = subDays(today, 7);
const maxDate = addDays(today, 30);

export default function DateFieldBasic() {
  return (
    <div>
      <h1>Date Field</h1>
      <div className={styles.Page}>
        <section>
          <h2>Formats</h2>
          <div className={styles.Form}>
            <Field.Root name="date-field-numeric" className={styles.Field}>
              <Field.Label className={styles.Label}>Numeric date (default)</Field.Label>
              <DateField.Root className={styles.Root}>
                <DateField.Input className={styles.Input}>
                  {(section) => (
                    <DateField.Section
                      key={section.index}
                      className={styles.Section}
                      section={section}
                    />
                  )}
                </DateField.Input>
              </DateField.Root>
            </Field.Root>
            <Field.Root name="date-field-weekday" className={styles.Field}>
              <Field.Label className={styles.Label}>With weekday</Field.Label>
              <DateField.Root className={styles.Root} format="EEEE, MMMM dd, yyyy">
                <DateField.Input className={styles.Input}>
                  {(section) => (
                    <DateField.Section
                      key={section.index}
                      className={styles.Section}
                      section={section}
                    />
                  )}
                </DateField.Input>
              </DateField.Root>
            </Field.Root>
            <Field.Root name="date-field-short-month" className={styles.Field}>
              <Field.Label className={styles.Label}>Short month</Field.Label>
              <DateField.Root className={styles.Root} format="MMM dd, yyyy">
                <DateField.Input className={styles.Input}>
                  {(section) => (
                    <DateField.Section
                      key={section.index}
                      className={styles.Section}
                      section={section}
                    />
                  )}
                </DateField.Input>
              </DateField.Root>
            </Field.Root>
            <Field.Root name="date-field-iso" className={styles.Field}>
              <Field.Label className={styles.Label}>ISO format</Field.Label>
              <DateField.Root className={styles.Root} format="yyyy-MM-dd">
                <DateField.Input className={styles.Input}>
                  {(section) => (
                    <DateField.Section
                      key={section.index}
                      className={styles.Section}
                      section={section}
                    />
                  )}
                </DateField.Input>
              </DateField.Root>
            </Field.Root>
            <Field.Root name="date-field-ordinal-day" className={styles.Field}>
              <Field.Label className={styles.Label}>Ordinal day</Field.Label>
              <DateField.Root className={styles.Root} format="MMMM do, yyyy">
                <DateField.Input className={styles.Input}>
                  {(section) => (
                    <DateField.Section
                      key={section.index}
                      className={styles.Section}
                      section={section}
                    />
                  )}
                </DateField.Input>
              </DateField.Root>
            </Field.Root>
          </div>
        </section>
        <section>
          <h2>Validation</h2>
          <div className={styles.Form}>
            <Field.Root name="date-field-required" className={styles.Field}>
              <Field.Label className={styles.Label}>Required</Field.Label>
              <DateField.Root className={styles.Root} required>
                <DateField.Input className={styles.Input}>
                  {(section) => (
                    <DateField.Section
                      key={section.index}
                      className={styles.Section}
                      section={section}
                    />
                  )}
                </DateField.Input>
              </DateField.Root>
              <Field.Error className={styles.Error} />
            </Field.Root>
            <Field.Root name="date-field-min" className={styles.Field}>
              <Field.Label className={styles.Label}>Min date (7 days ago)</Field.Label>
              <DateField.Root className={styles.Root} required minDate={minDate}>
                <DateField.Input className={styles.Input}>
                  {(section) => (
                    <DateField.Section
                      key={section.index}
                      className={styles.Section}
                      section={section}
                    />
                  )}
                </DateField.Input>
              </DateField.Root>
              <Field.Error className={styles.Error} />
            </Field.Root>
            <Field.Root name="date-field-max" className={styles.Field}>
              <Field.Label className={styles.Label}>Max date (30 days from now)</Field.Label>
              <DateField.Root className={styles.Root} required maxDate={maxDate}>
                <DateField.Input className={styles.Input}>
                  {(section) => (
                    <DateField.Section
                      key={section.index}
                      className={styles.Section}
                      section={section}
                    />
                  )}
                </DateField.Input>
              </DateField.Root>
              <Field.Error className={styles.Error} />
            </Field.Root>
            <Field.Root name="date-field-min-max" className={styles.Field}>
              <Field.Label className={styles.Label}>
                Min and max date (7 days ago to 30 days from now)
              </Field.Label>
              <DateField.Root className={styles.Root} required minDate={minDate} maxDate={maxDate}>
                <DateField.Input className={styles.Input}>
                  {(section) => (
                    <DateField.Section
                      key={section.index}
                      className={styles.Section}
                      section={section}
                    />
                  )}
                </DateField.Input>
              </DateField.Root>
              <Field.Error className={styles.Error} />
            </Field.Root>
          </div>
        </section>
        <section>
          <h2>Native Validation with Form</h2>
          <p>
            Min: {format(minDate, 'yyyy-MM-dd')} | Max: {format(maxDate, 'yyyy-MM-dd')}
          </p>
          <Form
            className={styles.Form}
            onFormSubmit={(formData) => {
              alert(`Form submitted with date: ${formData['date-form-validation']}`);
            }}
          >
            <Field.Root name="date-form-validation" className={styles.Field}>
              <Field.Label className={styles.Label}>
                Select a date (native validation on submit)
              </Field.Label>
              <DateField.Root className={styles.Root} required minDate={minDate} maxDate={maxDate}>
                <DateField.Input className={styles.Input}>
                  {(section) => (
                    <DateField.Section
                      key={section.index}
                      className={styles.Section}
                      section={section}
                    />
                  )}
                </DateField.Input>
              </DateField.Root>
              <Field.Error match="valueMissing" className={styles.Error}>
                Please select a date
              </Field.Error>
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
        </section>
      </div>
    </div>
  );
}
