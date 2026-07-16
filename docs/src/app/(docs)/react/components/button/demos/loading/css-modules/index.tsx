'use client';
import * as React from 'react';
import { Button } from '@base-ui/react/button';
import styles from './index.module.css';

export default function ExampleButton() {
  const [loading, setLoading] = React.useState(false);

  return (
    <React.Fragment>
      <Button
        className={styles.Button}
        disabled={loading}
        focusableWhenDisabled
        onClick={() => {
          setLoading(true);
          setTimeout(() => {
            setLoading(false);
          }, 4000);
        }}
      >
        {loading ? 'Submitting' : 'Submit'}
      </Button>
      <span role="status" className={styles.VisuallyHidden}>
        {loading ? 'Submitting' : null}
      </span>
    </React.Fragment>
  );
}
