import * as React from 'react';
import { Button } from '@base-ui-components/react/button';
import styles from './index.module.css';

export default function ExampleButton() {
  const [pending, setPending] = React.useState(false);

  return (
    <Button
      className={styles.Button}
      pending={pending}
      onClick={() => {
        setPending(true);
        setTimeout(() => {
          setPending(false);
        }, 4000);
      }}
    >
      {pending ? 'Submitting' : 'Submit'}
    </Button>
  );
}
