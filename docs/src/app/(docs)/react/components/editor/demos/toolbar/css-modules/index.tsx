'use client';
import * as React from 'react';
import { Editor } from '@base-ui/react/editor';
import styles from './index.module.css';

export default function ExampleEditorWithToolbar() {
  const [value, setValue] = React.useState<any | undefined>(undefined);

  return (
    <div className={styles.Container}>
      <label className={styles.Label}>Toolbar</label>
      <Editor value={value} onChange={setValue} placeholder="Type your message...">
        <Editor.Toolbar />
      </Editor>
    </div>
  );
}
