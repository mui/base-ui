'use client';
import * as React from 'react';
import { Editor } from '@base-ui/react/editor';
import styles from './index.module.css';

export default function ExampleEditorCustomization() {
  const [value, setValue] = React.useState<any | undefined>(undefined);

  return (
    <div className={styles.Container}>
      <label className={styles.Label}>Restricted Formatting (Bold & Italic only)</label>
      <Editor
        value={value}
        onChange={setValue}
        placeholder="Try Cmd+B or Cmd+I. Cmd+U will be ignored."
        enabledFormats={['bold', 'italic', 'undo', 'redo']}
      >
        <Editor.Toolbar />
      </Editor>
    </div>
  );
}
