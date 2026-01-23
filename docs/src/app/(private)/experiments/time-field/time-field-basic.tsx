'use client';
import * as React from 'react';
import { set } from 'date-fns';
import { Field } from '@base-ui/react/field';
import { TimeField } from '@base-ui/react/time-field';
import styles from './time-field.module.css';

const today = new Date();
const minTime = set(today, { hours: 9, minutes: 0, seconds: 0 });
const maxTime = set(today, { hours: 17, minutes: 30, seconds: 0 });

export default function TimeFieldBasic() {
  return (
    <div>
      <h1>Time Field</h1>
      <div className={styles.Page}>
        <section>
          <h2>Formats</h2>
          <div className={styles.Form}>
            <Field.Root name="time-field-default" className={styles.Field}>
              <Field.Label className={styles.Label}>Default format</Field.Label>
              <TimeField.Root className={styles.Root}>
                <TimeField.Input className={styles.Input}>
                  {(section) => (
                    <TimeField.Section
                      key={section.index}
                      className={styles.Section}
                      section={section}
                    />
                  )}
                </TimeField.Input>
              </TimeField.Root>
            </Field.Root>
            <Field.Root name="time-field-seconds-12h" className={styles.Field}>
              <Field.Label className={styles.Label}>12-hour with seconds</Field.Label>
              <TimeField.Root className={styles.Root} format="hh:mm:ss aa">
                <TimeField.Input className={styles.Input}>
                  {(section) => (
                    <TimeField.Section
                      key={section.index}
                      className={styles.Section}
                      section={section}
                    />
                  )}
                </TimeField.Input>
              </TimeField.Root>
            </Field.Root>
            <Field.Root name="time-field-24h" className={styles.Field}>
              <Field.Label className={styles.Label}>24-hour</Field.Label>
              <TimeField.Root className={styles.Root} ampm={false}>
                <TimeField.Input className={styles.Input}>
                  {(section) => (
                    <TimeField.Section
                      key={section.index}
                      className={styles.Section}
                      section={section}
                    />
                  )}
                </TimeField.Input>
              </TimeField.Root>
            </Field.Root>
            <Field.Root name="time-field-24h-seconds" className={styles.Field}>
              <Field.Label className={styles.Label}>24-hour with seconds</Field.Label>
              <TimeField.Root className={styles.Root} format="HH:mm:ss">
                <TimeField.Input className={styles.Input}>
                  {(section) => (
                    <TimeField.Section
                      key={section.index}
                      className={styles.Section}
                      section={section}
                    />
                  )}
                </TimeField.Input>
              </TimeField.Root>
            </Field.Root>
            <Field.Root name="time-field-step" className={styles.Field}>
              <Field.Label className={styles.Label}>5-minute step</Field.Label>
              <TimeField.Root className={styles.Root} step={5}>
                <TimeField.Input className={styles.Input}>
                  {(section) => (
                    <TimeField.Section
                      key={section.index}
                      className={styles.Section}
                      section={section}
                    />
                  )}
                </TimeField.Input>
              </TimeField.Root>
            </Field.Root>
          </div>
        </section>
        <section>
          <h2>Validation</h2>
          <div className={styles.Form}>
            <Field.Root name="time-field-required" className={styles.Field}>
              <Field.Label className={styles.Label}>Required</Field.Label>
              <TimeField.Root className={styles.Root} required>
                <TimeField.Input className={styles.Input}>
                  {(section) => (
                    <TimeField.Section
                      key={section.index}
                      className={styles.Section}
                      section={section}
                    />
                  )}
                </TimeField.Input>
              </TimeField.Root>
              <Field.Error className={styles.Error} />
            </Field.Root>
            <Field.Root name="time-field-min" className={styles.Field}>
              <Field.Label className={styles.Label}>Min time (9:00 AM)</Field.Label>
              <TimeField.Root className={styles.Root} required minTime={minTime}>
                <TimeField.Input className={styles.Input}>
                  {(section) => (
                    <TimeField.Section
                      key={section.index}
                      className={styles.Section}
                      section={section}
                    />
                  )}
                </TimeField.Input>
              </TimeField.Root>
              <Field.Error className={styles.Error} />
            </Field.Root>
            <Field.Root name="time-field-max" className={styles.Field}>
              <Field.Label className={styles.Label}>Max time (5:30 PM)</Field.Label>
              <TimeField.Root className={styles.Root} required maxTime={maxTime}>
                <TimeField.Input className={styles.Input}>
                  {(section) => (
                    <TimeField.Section
                      key={section.index}
                      className={styles.Section}
                      section={section}
                    />
                  )}
                </TimeField.Input>
              </TimeField.Root>
              <Field.Error className={styles.Error} />
            </Field.Root>
            <Field.Root name="time-field-min-max" className={styles.Field}>
              <Field.Label className={styles.Label}>
                Min and max time (9:00 AM to 5:30 PM)
              </Field.Label>
              <TimeField.Root className={styles.Root} required minTime={minTime} maxTime={maxTime}>
                <TimeField.Input className={styles.Input}>
                  {(section) => (
                    <TimeField.Section
                      key={section.index}
                      className={styles.Section}
                      section={section}
                    />
                  )}
                </TimeField.Input>
              </TimeField.Root>
              <Field.Error className={styles.Error} />
            </Field.Root>
          </div>
        </section>
      </div>
    </div>
  );
}
