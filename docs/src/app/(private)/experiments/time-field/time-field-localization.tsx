'use client';
import * as React from 'react';
import { fr } from 'date-fns/locale/fr';
import { Field } from '@base-ui/react/field';
import { TimeField } from '@base-ui/react/time-field';
import { LocalizationProvider } from '@base-ui/react/localization-provider';
import styles from './time-field-localization.module.css';

export default function TimeFieldLocalization() {
  return (
    <div>
      <h1>Time Field Localization</h1>
      <div className={styles.Page}>
        <section className={styles.Form}>
          <LocalizationProvider temporalLocale={fr}>
            <Field.Root name="time-field-fr-default" className={styles.Field}>
              <Field.Label className={styles.Label}>
                French locale (24h clock by default)
              </Field.Label>
              <TimeField.Root className={styles.Root}>
                {(section) => (
                  <TimeField.Section
                    key={section.index}
                    className={styles.Section}
                    section={section}
                  />
                )}
              </TimeField.Root>
            </Field.Root>
          </LocalizationProvider>
          <LocalizationProvider
            translations={{
              temporalFieldHoursPlaceholder: () => 'hh',
              temporalFieldMinutesPlaceholder: () => 'mm',
              temporalFieldMeridiemPlaceholder: () => 'AM',
            }}
          >
            <Field.Root name="time-field-fr-seconds" className={styles.Field}>
              <Field.Label className={styles.Label}>Custom placeholders</Field.Label>
              <TimeField.Root className={styles.Root} ampm>
                {(section) => (
                  <TimeField.Section
                    key={section.index}
                    className={styles.Section}
                    section={section}
                  />
                )}
              </TimeField.Root>
            </Field.Root>
          </LocalizationProvider>
        </section>
      </div>
    </div>
  );
}
