import * as React from 'react';
import { Field } from '@base-ui/react/field';
import { Form } from '@base-ui/react/form';
import styles from '../field.module.css';

/**
 * Recreation of cloudflare/kumo's Field wrapper: the whole composition collapses into
 * one flat prop set (`label`, `required`, `description`, `error`, `hideLabel`) instead
 * of exposing `Field.Label`/`Field.Description`/`Field.Error` as JSX children, with a
 * `hideLabel` escape hatch for controls (like Select) that already supply their own
 * accessible label. Recomposed from the ideas in cloudflare/kumo `field.tsx` (MIT,
 * code-ok, research/d-real-world-usage/field/ranked.json #1).
 */
function KumoField({
  name,
  label,
  hideLabel,
  required,
  description,
  errorMessage,
  children,
}: {
  name: string;
  label: string;
  hideLabel?: boolean;
  required?: boolean;
  description?: string;
  errorMessage?: string;
  children: (inputProps: { id?: string; required?: boolean }) => React.ReactNode;
}) {
  return (
    <Field.Root name={name} className={styles.Field}>
      {hideLabel ? null : <Field.Label className={styles.Label}>{label}</Field.Label>}
      {children({ required })}
      {description ? (
        <Field.Description className={styles.Description}>{description}</Field.Description>
      ) : null}
      <Field.Error className={styles.Error} match="valueMissing">
        {errorMessage ?? 'This field is required.'}
      </Field.Error>
    </Field.Root>
  );
}

export function FlatPropFieldExample() {
  const [status, setStatus] = React.useState<string | null>(null);
  return (
    <Form
      className={styles.Row}
      onSubmit={(event) => {
        event.preventDefault();
        setStatus('Saved');
      }}
    >
      <KumoField
        name="fullName"
        label="Full name"
        required
        description="As it appears on your ID."
        errorMessage="Please enter your full name."
      >
        {({ required }) => (
          <Field.Control required={required} placeholder="Ada Lovelace" className={styles.Input} />
        )}
      </KumoField>
      <KumoField
        name="search"
        label="Search"
        hideLabel
        required
        errorMessage="Please enter a search term."
      >
        {({ required }) => (
          <Field.Control
            required={required}
            aria-label="Search"
            placeholder="Search…"
            className={styles.Input}
          />
        )}
      </KumoField>
      <button type="submit" className={styles.Button}>
        Save
      </button>
      {status ? <output className={styles.Output}>{status}</output> : null}
    </Form>
  );
}
