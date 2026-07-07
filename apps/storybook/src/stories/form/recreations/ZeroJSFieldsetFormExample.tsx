import * as React from 'react';
import { Form } from '@base-ui/react/form';
import { Field } from '@base-ui/react/field';
import { Fieldset } from '@base-ui/react/fieldset';
import styles from '../form.module.css';
import rw from '../form-real-world.module.css';

/**
 * Recreation of nauvalazhar/selia's zero-JS validation demo: a `Fieldset` groups two
 * required inputs, and native `required` plus a children-only `Field.Error
 * match="valueMissing"` is the entire validation story — no application `validate`
 * function, no schema library, just browser-native constraint validation surfaced
 * through Base UI's own parts. Recomposed from the ideas in nauvalazhar/selia
 * `form.tsx`/`basic.tsx` (MIT, code-ok,
 * research/d-real-world-usage/form/ranked.json #3).
 */
export function ZeroJSFieldsetFormExample() {
  const [status, setStatus] = React.useState<string | null>(null);

  return (
    <Form
      className={styles.Form}
      onSubmit={(event) => {
        event.preventDefault();
        setStatus('Submitted');
      }}
    >
      <Fieldset.Root className={rw.Fieldset}>
        <Fieldset.Legend className={rw.Legend}>Contact information</Fieldset.Legend>
        <Field.Root name="name" className={styles.Field}>
          <Field.Label className={styles.Label}>Name</Field.Label>
          <Field.Control required className={styles.Input} />
          <Field.Error className={styles.Error} match="valueMissing">
            This is required
          </Field.Error>
        </Field.Root>
        <Field.Root name="email" className={styles.Field}>
          <Field.Label className={styles.Label}>Email</Field.Label>
          <Field.Control type="email" required className={styles.Input} />
          <Field.Error className={styles.Error} match="valueMissing">
            This is required
          </Field.Error>
        </Field.Root>
      </Fieldset.Root>
      <button type="submit" className={styles.Button}>
        Submit
      </button>
      {status ? <output className={styles.Output}>{status}</output> : null}
    </Form>
  );
}
