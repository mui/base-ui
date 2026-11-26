'use client';
import * as React from 'react';
import { Listbox } from '@base-ui/react/listbox';
import styles from './index.module.css';

const labels = [
  { label: 'Bug', value: 'bug' },
  { label: 'Design', value: 'design' },
  { label: 'Docs', value: 'docs' },
  { label: 'Feature', value: 'feature' },
  { label: 'Good first issue', value: 'good-first-issue' },
  { label: 'Performance', value: 'performance' },
  { label: 'Question', value: 'question' },
  { label: 'Security', value: 'security' },
  { label: 'Tests', value: 'tests' },
];

export default function ExampleListboxMultiSelection() {
  const [value, setValue] = React.useState<string[]>(['bug', 'performance']);

  return (
    <Listbox.Root multiple value={value} onValueChange={setValue}>
      <div className={styles.Panel}>
        <div className={styles.Header}>
          <Listbox.Label className={styles.Label}>Labels</Listbox.Label>
          <span className={styles.Count}>
            {value.length} of {labels.length} selected
          </span>
        </div>
        <Listbox.List className={styles.List}>
          {labels.map(({ label, value: itemValue }) => (
            <Listbox.Item key={itemValue} value={itemValue} className={styles.Item}>
              <span className={styles.Checkbox}>
                <Listbox.ItemIndicator className={styles.ItemIndicator}>
                  <CheckIcon />
                </Listbox.ItemIndicator>
              </span>
              <span className={styles.ItemText}>{label}</span>
            </Listbox.Item>
          ))}
        </Listbox.List>
      </div>
    </Listbox.Root>
  );
}

function CheckIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="m2.5 8.5 4 4 7-9" />
    </svg>
  );
}
