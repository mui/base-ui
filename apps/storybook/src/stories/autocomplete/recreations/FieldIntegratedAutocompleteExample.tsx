import * as React from 'react';
import { Autocomplete } from '@base-ui/react/autocomplete';
import { Field } from '@base-ui/react/field';
import { Form } from '@base-ui/react/form';
import styles from '../autocomplete.module.css';
import rw from '../autocomplete-real-world.module.css';

/**
 * Recreation of cloudflare/kumo's Autocomplete wrapper: label/required/description/error
 * arrive as flat top-level props instead of composed `Field` children, and the component
 * wraps `Field.Root`/`Autocomplete.Root` internally. Kumo's own JSDoc draws the line for
 * consumers: "Unlike Combobox, the input value is not constrained to the suggestion list
 * items." Recomposed from the ideas in cloudflare/kumo `autocomplete.tsx` (MIT, code-ok,
 * research/d-real-world-usage/autocomplete/ranked.json #7).
 */
function LabeledAutocomplete({
  name,
  label,
  description,
  errorMessage,
  required,
  placeholder,
  items,
}: {
  name: string;
  label: string;
  description?: string;
  errorMessage?: string;
  required?: boolean;
  placeholder?: string;
  items: readonly string[];
}) {
  return (
    <Field.Root name={name} className={rw.Field}>
      <Field.Label className={styles.Label}>{label}</Field.Label>
      <Autocomplete.Root items={items} required={required}>
        <Autocomplete.Input placeholder={placeholder} className={styles.Input} />
        <Autocomplete.Portal>
          <Autocomplete.Positioner className={styles.Positioner} sideOffset={4}>
            <Autocomplete.Popup className={styles.Popup}>
              <Autocomplete.Empty className={styles.Empty}>No matches.</Autocomplete.Empty>
              <Autocomplete.List className={styles.List}>
                {(item: string) => (
                  <Autocomplete.Item key={item} value={item} className={styles.Item}>
                    {item}
                  </Autocomplete.Item>
                )}
              </Autocomplete.List>
            </Autocomplete.Popup>
          </Autocomplete.Positioner>
        </Autocomplete.Portal>
      </Autocomplete.Root>
      {description ? (
        <Field.Description className={styles.Description}>{description}</Field.Description>
      ) : null}
      <Field.Error className={styles.Error} match="valueMissing">
        {errorMessage ?? 'This field is required.'}
      </Field.Error>
    </Field.Root>
  );
}

const destinations = ['Amsterdam', 'Berlin', 'Lisbon', 'Prague', 'Reykjavik'];

export function FieldIntegratedAutocompleteExample() {
  const [status, setStatus] = React.useState<string | null>(null);
  return (
    <Form
      className={styles.Form}
      onSubmit={(event) => {
        event.preventDefault();
        setStatus('Submitted');
      }}
    >
      <LabeledAutocomplete
        name="destination"
        label="Destination"
        description="Unlike Combobox, any typed value is accepted — suggestions only help."
        errorMessage="Please enter a destination."
        required
        placeholder="e.g. Lisbon"
        items={destinations}
      />
      <button type="submit" className={styles.Button}>
        Book trip
      </button>
      {status ? <output className={styles.Output}>{status}</output> : null}
    </Form>
  );
}
