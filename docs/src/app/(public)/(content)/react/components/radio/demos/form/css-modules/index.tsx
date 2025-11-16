'use client';
import * as React from 'react';
import { Form } from '@base-ui-components/react/form';
import { Fieldset } from '@base-ui-components/react/fieldset';
import { Field } from '@base-ui-components/react/field';
import { Radio } from '@base-ui-components/react/radio';
import { RadioGroup } from '@base-ui-components/react/radio-group';
import styles from './index.module.css';

export default function DemoRadioGroupForm() {
  const [loading, setLoading] = React.useState(false);
  return (
    <Form
      className={styles.Form}
      onSubmit={async (event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        setLoading(true);
        await submitForm(formData);
        setLoading(false);
      }}
    >
      <Field.Root name="shipping">
        <Fieldset.Root
          render={
            <RadioGroup defaultValue="standard" disabled={loading} className={styles.RadioGroup} />
          }
        >
          <Fieldset.Legend className={styles.Legend}>Shipping method</Fieldset.Legend>
          <Field.Item className={styles.Item}>
            <Radio.Root value="standard" className={styles.Radio}>
              <Radio.Indicator className={styles.Indicator} />
            </Radio.Root>
            <Field.Label>Standard</Field.Label>
          </Field.Item>

          <Field.Item className={styles.Item}>
            <Radio.Root value="express" className={styles.Radio}>
              <Radio.Indicator className={styles.Indicator} />
            </Radio.Root>
            <Field.Label>Express</Field.Label>
          </Field.Item>
        </Fieldset.Root>
      </Field.Root>
      <button type="submit" disabled={loading} className={styles.Button}>
        Confirm
      </button>
    </Form>
  );
}

async function submitForm(formData: FormData) {
  // Mimic a server response
  await new Promise((resolve) => {
    setTimeout(resolve, 1000);
  });

  try {
    const shipping = formData.get('shipping');

    return {
      success: true,
      data: {
        shipping,
      },
    };
  } catch {
    return { errors: { shipping: 'Server error' } };
  }
}
