'use client';
import * as React from 'react';
import { TimeField } from '@base-ui/react/time-field';
import styles from '../date-field/date-field.module.css';

export default function TimeFieldBasic() {
  return (
    <TimeField.Root className={styles.Root} format="HH:mm">
      <TimeField.Input className={styles.Input}>
        {(section) => (
          <React.Fragment key={section.index}>
            <TimeField.Section className={styles.Section} section={section} />
            {section.token.separator}
          </React.Fragment>
        )}
      </TimeField.Input>
    </TimeField.Root>
  );
}
