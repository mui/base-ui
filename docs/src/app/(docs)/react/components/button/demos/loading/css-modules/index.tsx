'use client';
import * as React from 'react';
import { Button } from '@base-ui/react/button';
import styles from './index.module.css';

export default function ExampleButton() {
  const [loading, setLoading] = React.useState(false);
  const labelId = React.useId();

  return (
    <Button
      className={styles.Button}
      disabled={loading}
      focusableWhenDisabled
      aria-labelledby={labelId}
      onClick={() => {
        setLoading(true);
        setTimeout(() => {
          setLoading(false);
        }, 4000);
      }}
    >
      <span id={labelId}>{loading ? 'Submitting' : 'Submit'}</span>
    </Button>
  );
}
