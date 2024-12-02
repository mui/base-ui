'use client';
import * as React from 'react';
import { Field } from '@base-ui-components/react/field';
import { Input as InputPrimitive } from '@base-ui-components/react/input';
import { styled } from '@mui/system';

function validate(value: string) {
  const password = value;
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long.');
  }

  if ((password.match(/[A-Z]/g) ?? []).length < 2) {
    errors.push('Password must contain at least 2 uppercase letters.');
  }

  if ((password.match(/[!@#$%^&*]/g) ?? []).length < 2) {
    errors.push(
      'Password must contain at least 2 unique symbols from the set [!@#$%^&*].',
    );
  }

  return errors;
}

export default function UnstyledFieldPassword() {
  const [value, setValue] = React.useState('');
  const errors = validate(value);

  return (
    <FieldRoot invalid={errors.length > 0}>
      <Field.Label>Password</Field.Label>
      <Input
        type="password"
        value={value}
        onChange={(event) => setValue(event.currentTarget.value)}
      />
      <FieldError forceShow>
        <ul>
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      </FieldError>
    </FieldRoot>
  );
}

const FieldRoot = styled(Field.Root)`
  width: 275px;
`;

const Input = styled(InputPrimitive)`
  border: 1px solid #ccc;
  border-radius: 4px;
  width: 100%;
  padding: 6px;
  font-size: 100%;

  &[data-valid][data-dirty] {
    border-color: green;
    background-color: rgb(0 255 0 / 0.1);
  }

  &[data-invalid][data-touched][data-dirty] {
    border-color: red;
    background-color: rgb(255 0 0 / 0.1);
  }

  &:focus {
    outline: 0;
    border-color: #0078d4;
    box-shadow: 0 0 0 3px rgba(0 100 255 / 0.3);

    &[data-valid][data-dirty] {
      border-color: green;
      box-shadow: 0 0 0 3px rgba(100 200 100 / 0.3);
    }

    &[data-invalid][data-touched][data-dirty] {
      border-color: red;
      box-shadow: 0 0 0 3px rgba(255 0 0 / 0.3);
    }
  }
`;

const FieldError = styled(Field.Error)`
  display: block;
  font-size: 90%;
  margin-top: 10px;
  line-height: 1.1;

  &[data-touched][data-dirty] {
    color: red;
  }

  ul {
    padding: 0;
  }
`;
