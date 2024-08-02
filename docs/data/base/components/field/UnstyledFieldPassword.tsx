import * as React from 'react';
import * as Field from '@base_ui/react/Field';

function validate(value: string) {
  const errors: string[] = [];

  if (value.length < 8) {
    errors.push('Password must be at least 8 characters long.');
  }

  if ((value.match(/[A-Z]/g) ?? []).length < 2) {
    errors.push('Password must contain at least 2 uppercase letters.');
  }

  if ((value.match(/[!@#$%^&*]/g) ?? []).length < 2) {
    errors.push(
      'Password must contain at least 2 unique symbols from the set [!@#$%^&*].',
    );
  }

  return errors;
}

export default function UnstyledFieldPassword() {
  function handleValidate(value: unknown) {
    const password = value as string;
    return validate(password);
  }

  return (
    <Field.Root validate={handleValidate} validateOnChange>
      <Field.Control type="password" />
      <Field.Label>Password</Field.Label>
      <Field.Error render={<ul />}>
        <Field.Validity>
          {(state) => state.errors.map((error) => <li key={error}>{error}</li>)}
        </Field.Validity>
      </Field.Error>
    </Field.Root>
  );
}
