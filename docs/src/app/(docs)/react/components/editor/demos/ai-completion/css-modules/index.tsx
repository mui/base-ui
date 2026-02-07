'use client';
import * as React from 'react';
import { Editor } from '@base-ui/react/editor';
import styles from './index.module.css';

// Mock AI completion provider
const mockAIProvider = async (text: string) => {
  // Simulate API delay
  await new Promise((resolve) => { setTimeout(resolve, 300) });

  const lastWord = text.split(/\s+/).pop()?.toLowerCase();

  const completions: Record<string, string> = {
    'base': ' UI is a great library',
    'react': ' is a popular library',
    'lexical': ' is a powerful editor framework',
    'hello': ' world, how are you today?',
    'this': ' is an AI-powered autocomplete example',
  };

  if (lastWord && completions[lastWord]) {
    return completions[lastWord];
  }

  return null;
};

export default function ExampleEditorWithAI() {
  const [value, setValue] = React.useState<any | undefined>(undefined);

  return (
    <div className={styles.Container}>
      <label className={styles.Label}>AI Autocomplete (Type "base", "react", or "this")</label>
      <Editor
        value={value}
        onChange={setValue}
        placeholder="Try typing 'base' or 'this'..."
        ai={{
          getCompletion: mockAIProvider,
          debounceMs: 300,
        }}
      >
        <Editor.Toolbar />
      </Editor>
      <p className={styles.Hint}>Press <strong>Tab</strong> to accept the completion.</p>
    </div>
  );
}
