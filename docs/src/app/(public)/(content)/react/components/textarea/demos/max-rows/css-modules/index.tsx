import * as React from 'react';
import { Textarea } from '@base-ui-components/react/textarea';
import styles from './index.module.css';

export default function ExampleTextarea() {
  return (
    <Textarea placeholder="Type something…" minRows={4} maxRows={8} className={styles.Textarea} />
  );
}
