'use client';
import * as React from 'react';
import { Field } from '@base-ui-components/react/field';
import { Form } from '@base-ui-components/react/form';
import { Slider } from '@base-ui-components/react/slider';
import formStyles from '../../../(public)/(content)/react/components/form/demos/hero/css-modules/index.module.css';
import styles from './slider.module.css';

interface FormValues {
  priceRange: string;
}

export default function ExampleForm() {
  const [errors, setErrors] = React.useState({});
  const [loading, setLoading] = React.useState(false);

  return (
    <Form
      className={formStyles.Form}
      style={{ maxWidth: '18rem' }}
      errors={errors}
      onClearErrors={setErrors}
      onSubmit={async (event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const formValues = Object.fromEntries(formData as any) as FormValues;
        console.log(formValues);

        setLoading(true);
        const response = await submitForm(formValues);
        const serverErrors = {
          priceRange: response.errors?.priceRange,
        };

        setErrors(serverErrors);
        setLoading(false);
        console.log('response', response);
      }}
    >
      <Field.Root name="priceRange" className={formStyles.Field}>
        <Slider.Root
          defaultValue={[500, 1200]}
          min={100}
          max={2000}
          step={1}
          minStepsBetweenValues={1}
          className={styles.Root}
          format={{
            style: 'currency',
            currency: 'EUR',
          }}
          locale="nl-NL"
          style={{ width: '18rem' }}
        >
          <Field.Label className={styles.Label}>Price range</Field.Label>
          <Slider.Value className={styles.Value} />
          <Slider.Control className={styles.Control}>
            <Slider.Track className={styles.Track}>
              <Slider.Indicator className={styles.Indicator} />
              <Slider.Thumb className={styles.Thumb} />
              <Slider.Thumb className={styles.Thumb} />
            </Slider.Track>
          </Slider.Control>
        </Slider.Root>
        <Field.Error className={formStyles.Error} />
      </Field.Root>
      <button disabled={loading} type="submit" className={formStyles.Button}>
        Search
      </button>
    </Form>
  );
}

async function submitForm(formValues: FormValues) {
  await new Promise((resolve) => {
    setTimeout(resolve, 600);
  });

  try {
    if (formValues.priceRange === '') {
      return { errors: { priceRange: 'server error: empty string' } };
    }
  } catch {
    return { errors: { priceRange: 'server error' } };
  }

  return {
    response: {
      results: Math.floor(Math.random() * 20) + 1,
    },
  };
}
