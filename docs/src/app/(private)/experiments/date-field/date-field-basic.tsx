'use client';
import * as React from 'react';
import { DateField } from '@base-ui/react/date-field';
import styles from './date-field.module.css';

export default function DateFieldBasic() {
  const [format, setFormat] = React.useState('P');

  return (
    <React.Fragment>
      <button onClick={() => setFormat(format === 'P' ? 'yyyy' : 'P')} type="button">
        Change format
      </button>
      <DateField.Root className={styles.Root} format={format}>
        <DateField.Input className={styles.Input}>
          {(section) => (
            <React.Fragment key={section.index}>
              <DateField.Section className={styles.Section} section={section} />
              {section.token.separator}
            </React.Fragment>
          )}
        </DateField.Input>
      </DateField.Root>
    </React.Fragment>
  );
}
