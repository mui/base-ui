'use client';
import * as React from 'react';
import { fr } from 'date-fns/locale/fr';
import { Field } from '@base-ui/react/field';
import { TimeField } from '@base-ui/react/time-field';
import { TemporalFieldPlaceholderGetters } from '@base-ui/react/types';
import { TemporalLocaleProvider } from '@base-ui/react/temporal-locale-provider';
import styles from './time-field-localization.module.css';

const CUSTOM_TIME_PLACEHOLDER_GETTERS: Partial<TemporalFieldPlaceholderGetters> = {
  hours: () => '––',
  minutes: () => '––',
  meridiem: () => 'AM',
};

export default function TimeFieldLocalization() {
  return (
    <div>
      <h1>Time Field Localization</h1>
      <div className={styles.Page}>
        <section className={styles.Form}>
          <TemporalLocaleProvider locale={fr}>
            <Field.Root name="time-field-fr-default" className={styles.Field}>
              <Field.Label className={styles.Label}>
                French locale (24h clock by default)
              </Field.Label>
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
            <Field.Root name="time-field-fr-seconds" className={styles.Field}>
              <Field.Label className={styles.Label}>Custom placeholders</Field.Label>
              <TimeField.Root
                className={styles.Root}
                placeholderGetters={CUSTOM_TIME_PLACEHOLDER_GETTERS}
                ampm
              >
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
          </TemporalLocaleProvider>
        </section>
      </div>
    </div>
  );
}
