'use client';
import * as React from 'react';
import { Field } from '@base-ui/react/field';
import { DateTimeField } from '@base-ui/react/date-time-field';
import styles from './date-time-field-basic.module.css';

export default function DateTimeFieldBasic() {
  return (
    <div>
      <h1>Date Time Field</h1>
      <div className={styles.Page}>
        <section>
          <h2>Format</h2>
          <div className={styles.Form}>
            <Field.Root name="date-time-field-default" className={styles.Field}>
              <Field.Label className={styles.Label}>Default format</Field.Label>
              <DateTimeField.Root className={styles.Root}>
                {(section) => (
                  <DateTimeField.Section
                    key={section.index}
                    className={styles.Section}
                    section={section}
                  />
                )}
              </DateTimeField.Root>
            </Field.Root>
            <Field.Root name="date-time-field-custom" className={styles.Field}>
              <Field.Label className={styles.Label}>Custom format (ISO-like)</Field.Label>
              <DateTimeField.Root className={styles.Root} format="yyyy-MM-dd HH:mm">
                {(section) => (
                  <DateTimeField.Section
                    key={section.index}
                    className={styles.Section}
                    section={section}
                  />
                )}
              </DateTimeField.Root>
            </Field.Root>
            <Field.Root name="date-time-field-12h" className={styles.Field}>
              <Field.Label className={styles.Label}>12-hour with meridiem</Field.Label>
              <DateTimeField.Root className={styles.Root} format="MM/dd/yyyy hh:mm aa">
                {(section) => (
                  <DateTimeField.Section
                    key={section.index}
                    className={styles.Section}
                    section={section}
                  />
                )}
              </DateTimeField.Root>
            </Field.Root>
            <Field.Root name="date-time-field-seconds" className={styles.Field}>
              <Field.Label className={styles.Label}>With seconds</Field.Label>
              <DateTimeField.Root className={styles.Root} format="MM/dd/yyyy HH:mm:ss">
                {(section) => (
                  <DateTimeField.Section
                    key={section.index}
                    className={styles.Section}
                    section={section}
                  />
                )}
              </DateTimeField.Root>
            </Field.Root>
          </div>
        </section>
        <section>
          <h2>AMPM</h2>
          <div className={styles.Form}>
            <Field.Root name="date-time-field-24h" className={styles.Field}>
              <Field.Label className={styles.Label}>24-hour (ampm=false)</Field.Label>
              <DateTimeField.Root className={styles.Root} ampm={false}>
                {(section) => (
                  <DateTimeField.Section
                    key={section.index}
                    className={styles.Section}
                    section={section}
                  />
                )}
              </DateTimeField.Root>
            </Field.Root>
            <Field.Root name="date-time-field-12h-ampm" className={styles.Field}>
              <Field.Label className={styles.Label}>12-hour (ampm=true)</Field.Label>
              <DateTimeField.Root className={styles.Root} ampm>
                {(section) => (
                  <DateTimeField.Section
                    key={section.index}
                    className={styles.Section}
                    section={section}
                  />
                )}
              </DateTimeField.Root>
            </Field.Root>
          </div>
        </section>
        <section>
          <h2>Step</h2>
          <div className={styles.Form}>
            <Field.Root name="date-time-field-step" className={styles.Field}>
              <Field.Label className={styles.Label}>5-minute step</Field.Label>
              <DateTimeField.Root className={styles.Root} step={5}>
                {(section) => (
                  <DateTimeField.Section
                    key={section.index}
                    className={styles.Section}
                    section={section}
                  />
                )}
              </DateTimeField.Root>
            </Field.Root>
          </div>
        </section>
        <section>
          <h2>Read only</h2>
          <div className={styles.Form}>
            <Field.Root name="date-time-field-readonly" className={styles.Field}>
              <Field.Label className={styles.Label}>Read only</Field.Label>
              <DateTimeField.Root className={styles.Root} readOnly>
                {(section) => (
                  <DateTimeField.Section
                    key={section.index}
                    className={styles.Section}
                    section={section}
                  />
                )}
              </DateTimeField.Root>
            </Field.Root>
          </div>
        </section>
        <section>
          <h2>Disabled</h2>
          <div className={styles.Form}>
            <Field.Root name="date-time-field-disabled" disabled className={styles.Field}>
              <Field.Label className={styles.Label}>Disabled</Field.Label>
              <DateTimeField.Root className={styles.Root}>
                {(section) => (
                  <DateTimeField.Section
                    key={section.index}
                    className={styles.Section}
                    section={section}
                  />
                )}
              </DateTimeField.Root>
            </Field.Root>
          </div>
        </section>
        <section>
          <h2>Clear button</h2>
          <div className={styles.Form}>
            <Field.Root name="date-time-field-with-clear" className={styles.Field}>
              <Field.Label className={styles.Label}>With clear button</Field.Label>
              <DateTimeField.Root className={styles.Root}>
                <DateTimeField.SectionList>
                  {(section) => (
                    <DateTimeField.Section
                      key={section.index}
                      className={styles.Section}
                      section={section}
                    />
                  )}
                </DateTimeField.SectionList>
                <DateTimeField.Clear className={styles.Clear} aria-label="Clear" />
              </DateTimeField.Root>
            </Field.Root>
          </div>
        </section>
      </div>
    </div>
  );
}
