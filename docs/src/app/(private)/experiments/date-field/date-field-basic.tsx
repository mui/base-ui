'use client';
import * as React from 'react';
import { DateField } from '@base-ui/react/date-field';
import styles from './date-field.module.css';

export default function DateFieldBasic() {
  return (
    <DateField.Root className={styles.Root}>
      <DateField.Input className={styles.Input}>
        {(section) => (
          <DateField.Section key={section.index} className={styles.Section} section={section} />
        )}
      </DateField.Input>
    </DateField.Root>
  );
}
