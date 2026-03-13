'use client';
import * as React from 'react';
import { fr } from 'date-fns/locale/fr';
import { Field } from '@base-ui/react/field';
import { TimeField } from '@base-ui/react/time-field';
import { LocalizationProvider } from '@base-ui/react/localization-provider';
import fieldStyles from '../../time-field.module.css';
import styles from './index.module.css';

export default function ExampleTimeFieldLocalization() {
  return (
    <div className={styles.Wrapper}>
      <LocalizationProvider temporalLocale={fr}>
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
      </LocalizationProvider>
      <LocalizationProvider
        translations={{
          temporalFieldHoursPlaceholder: () => 'hh',
          temporalFieldMinutesPlaceholder: () => 'mm',
          temporalFieldMeridiemPlaceholder: () => 'AM',
        }}
      >
        <Field.Root className={fieldStyles.Field}>
          <Field.Label className={fieldStyles.Label}>Custom placeholders</Field.Label>
          <TimeField.Root className={fieldStyles.Root} ampm>
            {(section) => (
              <TimeField.Section
                key={section.index}
                className={fieldStyles.Section}
                section={section}
              />
            )}
          </TimeField.Root>
        </Field.Root>
      </LocalizationProvider>
    </div>
  );
}
