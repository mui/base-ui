import * as React from 'react';
import { Separator } from '@base-ui-components/react/separator';
import styles from './index.module.css';

export default function ExampleSeparator() {
  return (
    <div className={styles.Container}>
      <a href="#" className={styles.Link}>
        Home
      </a>
      <a href="#" className={styles.Link}>
        Pricing
      </a>
      <a href="#" className={styles.Link}>
        Blog
      </a>
      <a href="#" className={styles.Link}>
        Support
      </a>

      <Separator className={styles.Separator} />

      <a href="#" className={styles.Link}>
        Log in
      </a>
      <a href="#" className={styles.Link}>
        Sign up
      </a>
    </div>
  );
}
