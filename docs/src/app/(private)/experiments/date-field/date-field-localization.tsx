'use client';
import * as React from 'react';
import { fr } from 'date-fns/locale/fr';
import { de } from 'date-fns/locale/de';
import { Field } from '@base-ui/react/field';
import { DateField } from '@base-ui/react/date-field';
import { LocalizationProvider } from '@base-ui/react/localization-provider';
import styles from './date-field-localization.module.css';

export default function DateFieldLocalization() {
  return (
    <div>
      <h1>Date Field Localization</h1>
      <div className={styles.Page}>
        <section className={styles.Form}>
          <LocalizationProvider
            temporalLocale={fr}
            translations={{
              temporalFieldYearPlaceholder: ({ digitAmount }) => 'A'.repeat(digitAmount),
              temporalFieldDayPlaceholder: () => 'JJ',
            }}
          >
            <Field.Root name="date-field-fr" className={styles.Field}>
              <Field.Label className={styles.Label}>
                French locale (date + placeholders)
              </Field.Label>
              <DateField.Root className={styles.Root}>
                {(section) => (
                  <DateField.Section
                    key={section.index}
                    className={styles.Section}
                    section={section}
                  />
                )}
              </DateField.Root>
            </Field.Root>
          </LocalizationProvider>
          <LocalizationProvider
            temporalLocale={de}
            translations={{
              temporalFieldYearPlaceholder: ({ digitAmount }) => 'J'.repeat(digitAmount),
              temporalFieldDayPlaceholder: () => 'TT',
            }}
          >
            <Field.Root name="date-field-de" className={styles.Field}>
              <Field.Label className={styles.Label}>
                German locale (date + placeholders)
              </Field.Label>
              <DateField.Root className={styles.Root}>
                {(section) => (
                  <DateField.Section
                    key={section.index}
                    className={styles.Section}
                    section={section}
                  />
                )}
              </DateField.Root>
            </Field.Root>
          </LocalizationProvider>
        </section>
      </div>
    </div>
  );
}
