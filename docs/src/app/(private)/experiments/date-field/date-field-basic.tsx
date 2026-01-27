'use client';
import * as React from 'react';
import { Field } from '@base-ui/react/field';
import { DateField } from '@base-ui/react/date-field';
import styles from './date-field-basic.module.css';

export default function DateFieldBasic() {
  return (
    <div>
      <h1>Date Field</h1>
      <div className={styles.Page}>
        <section>
          <h2>Format</h2>
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
          <h2>Read only</h2>
          <div className={styles.Form}>
            <Field.Root name="date-field-readonly" className={styles.Field}>
              <Field.Label className={styles.Label}>Read only</Field.Label>
              <DateField.Root className={styles.Root} readOnly>
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
          <h2>Disabled</h2>
          <div className={styles.Form}>
            <Field.Root name="date-field-disabled" disabled className={styles.Field}>
              <Field.Label className={styles.Label}>Disabled</Field.Label>
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
          </div>
        </section>
      </div>
    </div>
  );
}
