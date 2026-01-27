'use client';
import * as React from 'react';
import { fr } from 'date-fns/locale/fr';
import { de } from 'date-fns/locale/de';
import { Field } from '@base-ui/react/field';
import { DateField } from '@base-ui/react/date-field';
import { TemporalFieldPlaceholderGetters } from '@base-ui/react/types';
import { TemporalLocaleProvider } from '@base-ui/react/temporal-locale-provider';
import styles from './date-field-localization.module.css';

const FRENCH_PLACEHOLDER_GETTERS: Partial<TemporalFieldPlaceholderGetters> = {
  year: (params) => 'A'.repeat(params.digitAmount),
  day: () => 'DD',
};

const GERMAN_PLACEHOLDER_GETTERS: Partial<TemporalFieldPlaceholderGetters> = {
  year: (params) => 'J'.repeat(params.digitAmount),
  day: () => 'TT',
};

export default function DateFieldLocalization() {
  return (
    <div>
      <h1>Date Field Localization</h1>
      <div className={styles.Page}>
        <section className={styles.Form}>
          <TemporalLocaleProvider locale={fr}>
            <Field.Root name="date-field-fr" className={styles.Field}>
              <Field.Label className={styles.Label}>
                French locale (date + placeholders)
              </Field.Label>
              <DateField.Root
                className={styles.Root}
                placeholderGetters={FRENCH_PLACEHOLDER_GETTERS}
              >
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
          </TemporalLocaleProvider>
          <TemporalLocaleProvider locale={de}>
            <Field.Root name="date-field-de" className={styles.Field}>
              <Field.Label className={styles.Label}>
                German locale (date + placeholders)
              </Field.Label>
              <DateField.Root
                className={styles.Root}
                placeholderGetters={GERMAN_PLACEHOLDER_GETTERS}
              >
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
          </TemporalLocaleProvider>
        </section>
      </div>
    </div>
  );
}
