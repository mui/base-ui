'use client'
import * as React from 'react';
import { Editor, EditorFloatingToolbar } from '@base-ui/react/editor';
import styles from './index.module.css';

export default function ExampleEditorFloatingToolbar() {
  const [value, setValue] = React.useState<any | undefined>(undefined);

  return (
    <div className={styles.Container}>
      <label>Message</label>
      <Editor value={value} onChange={setValue} placeholder="Select some text to format" className={styles.Editor}>
        <EditorFloatingToolbar />
      </Editor>
    </div>
  );
}
