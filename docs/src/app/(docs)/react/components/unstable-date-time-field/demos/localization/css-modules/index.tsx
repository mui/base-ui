'use client';
import * as React from 'react';
import { fr } from 'date-fns/locale/fr';
import { de } from 'date-fns/locale/de';
import { Field } from '@base-ui/react/field';
import { DateTimeField } from '@base-ui/react/date-time-field';
import { LocalizationProvider } from '@base-ui/react/localization-provider';
import fieldStyles from '../../date-time-field.module.css';
import styles from './index.module.css';

export default function ExampleDateTimeFieldLocalization() {
  return (
    <div className={styles.Wrapper}>
      <LocalizationProvider
        temporalLocale={fr}
        translations={{
          temporalFieldYearPlaceholder: ({ digitAmount }) => 'A'.repeat(digitAmount),
          temporalFieldDayPlaceholder: () => 'JJ',
        }}
      >
        <Field.Root className={fieldStyles.Field}>
          <Field.Label className={fieldStyles.Label}>French locale</Field.Label>
          <DateTimeField.Root className={fieldStyles.Root}>
            {(section) => (
              <DateTimeField.Section
                key={section.index}
                className={fieldStyles.Section}
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
        <Field.Root className={fieldStyles.Field}>
          <Field.Label className={fieldStyles.Label}>German locale</Field.Label>
          <DateTimeField.Root className={fieldStyles.Root}>
            {(section) => (
              <DateTimeField.Section
                key={section.index}
                className={fieldStyles.Section}
                section={section}
              />
            )}
          </DateTimeField.Root>
        </Field.Root>
      </LocalizationProvider>
    </div>
  );
}
