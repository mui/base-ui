'use client';
import * as React from 'react';
import { fr } from 'date-fns/locale/fr';
import { de } from 'date-fns/locale/de';
import { Field } from '@base-ui/react/field';
import { DateTimeField } from '@base-ui/react/date-time-field';
import { LocalizationProvider } from '@base-ui/react/localization-provider';
import styles from './date-time-field-localization.module.css';

export default function DateTimeFieldLocalization() {
  return (
    <div>
      <h1>Date Time Field Localization</h1>
      <div className={styles.Page}>
        <section className={styles.Form}>
          <LocalizationProvider
            temporalLocale={fr}
            translations={{
              temporalFieldYearPlaceholder: ({ digitAmount }) => 'A'.repeat(digitAmount),
              temporalFieldDayPlaceholder: () => 'JJ',
            }}
          >
            <Field.Root name="datetime-field-fr-custom" className={styles.Field}>
              <Field.Label className={styles.Label}>French (date + placeholders)</Field.Label>
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
          </LocalizationProvider>
          <LocalizationProvider
            temporalLocale={de}
            translations={{
              temporalFieldYearPlaceholder: ({ digitAmount }) => 'J'.repeat(digitAmount),
              temporalFieldDayPlaceholder: () => 'TT',
            }}
          >
            <Field.Root name="datetime-field-de-default" className={styles.Field}>
              <Field.Label className={styles.Label}>German (date + placeholders)</Field.Label>
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
          </LocalizationProvider>
          <LocalizationProvider
            temporalLocale={de}
            translations={{
              temporalFieldYearPlaceholder: ({ digitAmount }) => 'J'.repeat(digitAmount),
              temporalFieldDayPlaceholder: () => 'TT',
            }}
          >
            <Field.Root name="datetime-field-de-12h" className={styles.Field}>
              <Field.Label className={styles.Label}>
                German (date + placeholders) with 12-hour format
              </Field.Label>
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
          </LocalizationProvider>
        </section>
      </div>
    </div>
  );
}
