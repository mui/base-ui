'use client';
import * as React from 'react';
import { fr } from 'date-fns/locale/fr';
import { de } from 'date-fns/locale/de';
import { Field } from '@base-ui/react/field';
import { DateTimeField } from '@base-ui/react/date-time-field';
import { TemporalFieldPlaceholderGetters } from '@base-ui/react/types';
import { TemporalLocaleProvider } from '@base-ui/react/temporal-locale-provider';
import styles from './date-time-field-localization.module.css';

const FRENCH_PLACEHOLDER_GETTERS: Partial<TemporalFieldPlaceholderGetters> = {
  year: (params) => 'A'.repeat(params.digitAmount),
  day: () => 'DD',
};

const GERMAN_PLACEHOLDER_GETTERS: Partial<TemporalFieldPlaceholderGetters> = {
  year: (params) => 'J'.repeat(params.digitAmount),
  day: () => 'TT',
};

export default function DateTimeFieldLocalization() {
  return (
    <div>
      <h1>Date Time Field Localization</h1>
      <div className={styles.Page}>
        <section className={styles.Form}>
          <TemporalLocaleProvider locale={fr}>
            <Field.Root name="datetime-field-fr-custom" className={styles.Field}>
              <Field.Label className={styles.Label}>French (date + placeholders)</Field.Label>
              <DateTimeField.Root
                className={styles.Root}
                placeholderGetters={FRENCH_PLACEHOLDER_GETTERS}
              >
                {(section) => (
                  <DateTimeField.Section
                    key={section.index}
                    className={styles.Section}
                    section={section}
                  />
                )}
              </DateTimeField.Root>
            </Field.Root>
          </TemporalLocaleProvider>
          <TemporalLocaleProvider locale={de}>
            <Field.Root name="datetime-field-de-default" className={styles.Field}>
              <Field.Label className={styles.Label}>German (date + placeholders)</Field.Label>
              <DateTimeField.Root
                className={styles.Root}
                placeholderGetters={GERMAN_PLACEHOLDER_GETTERS}
              >
                {(section) => (
                  <DateTimeField.Section
                    key={section.index}
                    className={styles.Section}
                    section={section}
                  />
                )}
              </DateTimeField.Root>
            </Field.Root>
          </TemporalLocaleProvider>
          <TemporalLocaleProvider locale={de}>
            <Field.Root name="datetime-field-de-12h" className={styles.Field}>
              <Field.Label className={styles.Label}>
                German (date + placeholders) with 12-hour format
              </Field.Label>
              <DateTimeField.Root
                className={styles.Root}
                placeholderGetters={GERMAN_PLACEHOLDER_GETTERS}
                ampm
              >
                {(section) => (
                  <DateTimeField.Section
                    key={section.index}
                    className={styles.Section}
                    section={section}
                  />
                )}
              </DateTimeField.Root>
            </Field.Root>
          </TemporalLocaleProvider>
        </section>
      </div>
    </div>
  );
}
