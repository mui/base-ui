'use client';
import * as React from 'react';
import { Button } from '@base-ui/react/button';
import styles from './index.module.css';

export default function ExampleButton() {
  const [loading, setLoading] = React.useState(false);

  return (
    <Button
      className={styles.Button}
      disabled={loading}
      focusableWhenDisabled
      aria-labelledby="label"
      onClick={() => {
        setLoading(true);
        setTimeout(() => {
          setLoading(false);
        }, 4000);
      }}
    >
      <span id="label">{loading ? 'Submitting' : 'Submit'}</span>
    </Button>
  );
}
