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
    const errors = validate(password);
    return errors.length ? 'error' : null;
  }

  return (
    <Field.Root validate={handleValidate} validateOnChange>
      <Field.Control type="password" />
      <Field.Label>Password</Field.Label>
      <Field.Message show="customError" render={<ul />} data-error>
        <Field.Validity>
          {(state) => {
            const password = state.value as string;
            const errors = validate(password);

            if (!errors.length) {
              return null;
            }

            return errors.map((error) => <li key={error}>{error}</li>);
          }}
        </Field.Validity>
      </Field.Message>
    </Field.Root>
  );
}
