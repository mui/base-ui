'use client';
import * as React from 'react';
import { fr } from 'date-fns/locale/fr';
import { Field } from '@base-ui/react/field';
import { TimeField } from '@base-ui/react/time-field';
import { TemporalFieldPlaceholderGetters } from '@base-ui/react/types';
import { TemporalLocaleProvider } from '@base-ui/react/temporal-locale-provider';
import fieldStyles from '../../time-field.module.css';
import styles from './index.module.css';

const CUSTOM_TIME_PLACEHOLDER_GETTERS: Partial<TemporalFieldPlaceholderGetters> = {
  hours: () => 'hh',
  minutes: () => 'mm',
  meridiem: () => 'AM',
};

export default function ExampleTimeFieldLocalization() {
  return (
    <div className={styles.Wrapper}>
      <TemporalLocaleProvider locale={fr}>
        <Field.Root className={fieldStyles.Field}>
          <Field.Label className={fieldStyles.Label}>
            French locale (24h clock by default)
          </Field.Label>
          <TimeField.Root className={fieldStyles.Root}>
            {(section) => (
              <TimeField.Section
                key={section.index}
                className={fieldStyles.Section}
                section={section}
              />
            )}
          </TimeField.Root>
        </Field.Root>
      </TemporalLocaleProvider>
      <Field.Root className={fieldStyles.Field}>
        <Field.Label className={fieldStyles.Label}>Custom placeholders</Field.Label>
        <TimeField.Root
          className={fieldStyles.Root}
          placeholderGetters={CUSTOM_TIME_PLACEHOLDER_GETTERS}
          ampm
        >
          {(section) => (
            <TimeField.Section
              key={section.index}
              className={fieldStyles.Section}
              section={section}
            />
          )}
        </TimeField.Root>
      </Field.Root>
    </div>
  );
}
