'use client';
import * as React from 'react';
import { Listbox } from '@base-ui/react/listbox';
import { Field } from '@base-ui/react/field';
import { Form } from '@base-ui/react/form';
import styles from './listbox.module.css';

const frameworks = [
  { label: 'React', value: 'react' },
  { label: 'Vue', value: 'vue' },
  { label: 'Angular', value: 'angular' },
  { label: 'Svelte', value: 'svelte' },
  { label: 'Solid', value: 'solid' },
];

const features = [
  { label: 'TypeScript', value: 'typescript' },
  { label: 'SSR', value: 'ssr' },
  { label: 'Routing', value: 'routing' },
  { label: 'State management', value: 'state' },
  { label: 'Testing', value: 'testing' },
];

export default function FormIntegrationListbox() {
  const [output, setOutput] = React.useState('');

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const entries: Record<string, string | string[]> = {};
    data.forEach((value, key) => {
      const existing = entries[key];
      if (existing) {
        entries[key] = Array.isArray(existing)
          ? [...existing, String(value)]
          : [existing, String(value)];
      } else {
        entries[key] = String(value);
      }
    });
    setOutput(JSON.stringify(entries, null, 2));
  }

  return (
    <Form className={styles.FormWrapper} onSubmit={handleSubmit}>
      <Field.Root name="framework">
        <Listbox.Root name="framework" required>
          <Listbox.Label className={styles.Label}>Framework (required)</Listbox.Label>
          <Listbox.List className={styles.List}>
            {frameworks.map(({ label, value }) => (
              <Listbox.Item key={value} value={value} className={styles.Item}>
                <Listbox.ItemIndicator className={styles.ItemIndicator}>
                  <CheckIcon className={styles.ItemIndicatorIcon} />
                </Listbox.ItemIndicator>
                <Listbox.ItemText className={styles.ItemText}>{label}</Listbox.ItemText>
              </Listbox.Item>
            ))}
          </Listbox.List>
          <Field.Error className={styles.FieldError} />
        </Listbox.Root>
      </Field.Root>

      <Field.Root name="features">
        <Listbox.Root name="features" multiple defaultValue={['typescript']}>
          <Listbox.Label className={styles.Label}>Features (multi-select)</Listbox.Label>
          <Listbox.List className={styles.List}>
            {features.map(({ label, value }) => (
              <Listbox.Item key={value} value={value} className={styles.Item}>
                <Listbox.ItemIndicator className={styles.ItemIndicator}>
                  <CheckIcon className={styles.ItemIndicatorIcon} />
                </Listbox.ItemIndicator>
                <Listbox.ItemText className={styles.ItemText}>{label}</Listbox.ItemText>
              </Listbox.Item>
            ))}
          </Listbox.List>
        </Listbox.Root>
      </Field.Root>

      <button type="submit" className={styles.SubmitButton}>
        Submit
      </button>

      {output && <pre className={styles.Output}>{output}</pre>}
    </Form>
  );
}

function CheckIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg fill="currentcolor" width="10" height="10" viewBox="0 0 10 10" {...props}>
      <path d="M9.1603 1.12218C9.50684 1.34873 9.60427 1.81354 9.37792 2.16038L5.13603 8.66012C5.01614 8.8438 4.82192 8.96576 4.60451 8.99384C4.3871 9.02194 4.1683 8.95335 4.00574 8.80615L1.24664 6.30769C0.939709 6.02975 0.916013 5.55541 1.19372 5.24822C1.47142 4.94102 1.94536 4.91731 2.2523 5.19524L4.36085 7.10461L8.12299 1.33999C8.34934 0.993152 8.81376 0.895638 9.1603 1.12218Z" />
    </svg>
  );
}
