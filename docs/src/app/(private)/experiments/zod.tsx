'use client';
import * as React from 'react';
import { z } from 'zod';
import { Field } from '@base-ui-components/react/field';
import { Form } from '@base-ui-components/react/form';
import { Input } from '@base-ui-components/react/input';

const schema = z.object({
  name: z.string().min(1),
  age: z.coerce.number().positive(),
});

function handleRequest(event: React.FormEvent<HTMLFormElement>) {
  const formData = new FormData(event.currentTarget);
  const result = schema.safeParse(Object.fromEntries(formData as any));

  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors,
    };
  }

  // ...
  return {
    errors: {},
  };
}

export default function Page() {
  const [errors, setErrors] = React.useState({});

  return (
    <Form
      onSubmit={(event) => {
        event.preventDefault();
        const { errors: reqErrors } = handleRequest(event);
        setErrors(reqErrors);
      }}
      errors={errors}
      onClearErrors={setErrors}
    >
      <Field.Root name="name">
        <Field.Label>Name</Field.Label>
        <Input />
        <Field.Error />
      </Field.Root>
      <Field.Root name="age">
        <Field.Label>Age</Field.Label>
        <Input />
        <Field.Error />
      </Field.Root>
      <button type="submit">Submit</button>
    </Form>
  );
}
