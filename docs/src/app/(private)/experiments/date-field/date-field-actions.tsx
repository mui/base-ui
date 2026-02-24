'use client';
import * as React from 'react';
import { Field } from '@base-ui/react/field';
import { DateField } from '@base-ui/react/date-field';
import styles from './date-field-basic.module.css';

function ClearIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
    </svg>
  );
}

const clearButtonStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '2rem',
  height: '2.5rem',
  padding: 0,
  border: '1px solid var(--color-gray-200)',
  borderRadius: '0.375rem',
  background: 'transparent',
  color: 'var(--color-gray-600)',
  cursor: 'pointer',
};

const fieldRowStyles: React.CSSProperties = {
  display: 'flex',
  gap: '0.5rem',
  alignItems: 'center',
};

export default function DateFieldActions() {
  return (
    <div>
      <h1>Date Field Actions</h1>
      <div className={styles.Page}>
        <section>
          <h2>Controlled with actionsRef</h2>
          <div className={styles.Form}>
            <ControlledExample />
          </div>
        </section>
        <section>
          <h2>Uncontrolled with actionsRef</h2>
          <div className={styles.Form}>
            <UncontrolledExample />
          </div>
        </section>
      </div>
    </div>
  );
}

function ControlledExample() {
  const [value, setValue] = React.useState<Date | null>(new Date());
  const actionsRef = React.useRef<DateField.Root.Actions>(null);

  return (
    <Field.Root name="date-field-controlled" className={styles.Field}>
      <Field.Label className={styles.Label}>Date</Field.Label>
      <div style={fieldRowStyles}>
        <DateField.Root
          className={styles.Root}
          actionsRef={actionsRef}
          value={value}
          onValueChange={setValue}
        >
          {(section) => (
            <DateField.Section key={section.index} className={styles.Section} section={section} />
          )}
        </DateField.Root>
        <button
          type="button"
          aria-label="Clear date"
          style={clearButtonStyles}
          onClick={() => actionsRef.current?.clear()}
        >
          <ClearIcon />
        </button>
      </div>
    </Field.Root>
  );
}

function UncontrolledExample() {
  const actionsRef = React.useRef<DateField.Root.Actions>(null);

  return (
    <Field.Root name="date-field-uncontrolled" className={styles.Field}>
      <Field.Label className={styles.Label}>Uncontrolled date</Field.Label>
      <div style={fieldRowStyles}>
        <DateField.Root className={styles.Root} actionsRef={actionsRef} defaultValue={new Date()}>
          {(section) => (
            <DateField.Section key={section.index} className={styles.Section} section={section} />
          )}
        </DateField.Root>
        <button
          type="button"
          aria-label="Clear date"
          style={clearButtonStyles}
          onClick={() => actionsRef.current?.clear()}
        >
          <ClearIcon />
        </button>
      </div>
    </Field.Root>
  );
}
