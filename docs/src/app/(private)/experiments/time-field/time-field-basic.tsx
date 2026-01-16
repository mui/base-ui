'use client';
import * as React from 'react';
import { TimeField } from '@base-ui/react/time-field';
import styles from '../date-field/date-field.module.css';

export default function TimeFieldBasic() {
  return (
    <TimeField.Root className={styles.Root} format="HH:mm">
      <TimeField.Input className={styles.Input}>
        {(section) => (
          <TimeField.Section key={section.index} className={styles.Section} section={section} />
        )}
      </TimeField.Input>
    </TimeField.Root>
  );
}
