'use client'
import * as React from 'react';
import { Editor } from '@base-ui/react/editor';
import styles from './index.module.css';

export default function ExampleEditor() {
  const [value, setValue] = React.useState<any | undefined>(undefined);

  return (
    <div className={styles.Container}>
      <Editor
        placeholder="Start typing..."
        className={styles.Editor}
        onChange={(next) => setValue(next)}
        value={value}
      />
    </div>
  );
}
