import * as React from 'react';
import { z } from 'zod';
import { Field } from '@base-ui-components/react/field';
import { Form } from '@base-ui-components/react/form';
import { Button } from '@base-ui-components/react/button';
import styles from './index.module.css';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  age: z.coerce.number('Age must be a number').positive('Age must be a positive number'),
});

async function submitForm(event: React.FormEvent<HTMLFormElement>) {
  event.preventDefault();

  const formData = new FormData(event.currentTarget);
  const result = schema.safeParse(Object.fromEntries(formData as any));

  if (!result.success) {
    return {
      errors: z.flattenError(result.error).fieldErrors,
    };
  }

  return {
    errors: {},
  };
}

export default function Page() {
  const [errors, setErrors] = React.useState({});

  return (
    <Form
      className={styles.Form}
      errors={errors}
      onClearErrors={setErrors}
      onSubmit={async (event) => {
        const response = await submitForm(event);
        setErrors(response.errors);
      }}
    >
      <Field.Root name="name" className={styles.Field}>
        <Field.Label className={styles.Label}>Name</Field.Label>
        <Field.Control placeholder="Enter name" className={styles.Input} />
        <Field.Error className={styles.Error} />
      </Field.Root>
      <Field.Root name="age" className={styles.Field}>
        <Field.Label className={styles.Label}>Age</Field.Label>
        <Field.Control placeholder="Enter age" className={styles.Input} />
        <Field.Error className={styles.Error} />
      </Field.Root>
      <Button
        type="submit"
        className="flex items-center justify-center h-10 px-3.5 m-0 outline-0 border border-gray-200 rounded-md bg-gray-50 font-inherit text-base font-medium leading-6 text-gray-900 select-none hover:data-[disabled]:bg-gray-50 hover:bg-gray-100 active:data-[disabled]:bg-gray-50 active:bg-gray-200 active:shadow-[inset_0_1px_3px_rgba(0,0,0,0.1)] active:border-t-gray-300 active:data-[disabled]:shadow-none active:data-[disabled]:border-t-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-800 focus-visible:-outline-offset-1 data-[disabled]:text-gray-500"
      >
        Submit
      </Button>
    </Form>
  );
}
