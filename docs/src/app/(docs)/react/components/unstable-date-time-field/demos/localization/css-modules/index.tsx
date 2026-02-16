'use client';
import * as React from 'react';
import { fr } from 'date-fns/locale/fr';
import { de } from 'date-fns/locale/de';
import { Field } from '@base-ui/react/field';
import { DateTimeField } from '@base-ui/react/date-time-field';
import { TemporalFieldPlaceholderGetters } from '@base-ui/react/types';
import { TemporalLocaleProvider } from '@base-ui/react/temporal-locale-provider';
import fieldStyles from '../../date-time-field.module.css';
import styles from './index.module.css';

const FRENCH_PLACEHOLDER_GETTERS: Partial<TemporalFieldPlaceholderGetters> = {
  year: (params) => 'A'.repeat(params.digitAmount),
  day: () => 'JJ',
};

const GERMAN_PLACEHOLDER_GETTERS: Partial<TemporalFieldPlaceholderGetters> = {
  year: (params) => 'J'.repeat(params.digitAmount),
  day: () => 'TT',
};

export default function ExampleDateTimeFieldLocalization() {
  return (
    <div className={styles.Wrapper}>
      <TemporalLocaleProvider locale={fr}>
        <Field.Root className={fieldStyles.Field}>
          <Field.Label className={fieldStyles.Label}>French locale</Field.Label>
          <DateTimeField.Root
            className={fieldStyles.Root}
            placeholderGetters={FRENCH_PLACEHOLDER_GETTERS}
          >
            {(section) => (
              <DateTimeField.Section
                key={section.index}
                className={fieldStyles.Section}
                section={section}
              />
            )}
          </DateTimeField.Root>
        </Field.Root>
      </TemporalLocaleProvider>
      <TemporalLocaleProvider locale={de}>
        <Field.Root className={fieldStyles.Field}>
          <Field.Label className={fieldStyles.Label}>German locale</Field.Label>
          <DateTimeField.Root
            className={fieldStyles.Root}
            placeholderGetters={GERMAN_PLACEHOLDER_GETTERS}
          >
            {(section) => (
              <DateTimeField.Section
                key={section.index}
                className={fieldStyles.Section}
                section={section}
              />
            )}
          </DateTimeField.Root>
        </Field.Root>
      </TemporalLocaleProvider>
    </div>
  );
}
