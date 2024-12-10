'use client';
import * as React from 'react';
import { Form } from '@base-ui-components/react/form';
import { Fieldset } from '@base-ui-components/react/fieldset';
import { Field } from '@base-ui-components/react/field';
import { Input as InputPrimitive } from '@base-ui-components/react/input';
import { styled } from '@mui/system';

export default function FormIntroduction() {
  const [errors, setErrors] = React.useState({});
  const [status, setStatus] = React.useState('initial');

  return (
    <FormRoot
      errors={errors}
      onClearErrors={setErrors}
      onSubmit={async (event) => {
        event.preventDefault();

        const formData = new FormData(event.currentTarget);
        const username = formData.get('username');
        const password = formData.get('password');

        setStatus('loading');

        // Mimic a server request
        await new Promise((resolve) => {
          setTimeout(resolve, 500);
        });

        const isUnknownUser = username !== 'admin';
        const isInvalidPassword = password !== 'admin';

        const serverErrors = {};

        if (isUnknownUser) {
          serverErrors.username = 'Username does not exist.';
          setStatus('error');
        } else if (isInvalidPassword) {
          serverErrors.password = 'Invalid password.';
          setStatus('error');
        } else {
          setStatus('success');
        }

        setErrors(serverErrors);
      }}
    >
      <FieldsetRoot>
        <FieldsetLegend>App login</FieldsetLegend>
        <p>
          Username and password are both <code>admin</code> to log in.
        </p>
        <Field.Root name="username">
          <Field.Label>Username</Field.Label>
          <Input required />
          <FieldError />
        </Field.Root>
        <Field.Root name="password">
          <Field.Label>Password</Field.Label>
          <Input type="password" required />
          <FieldError />
        </Field.Root>
      </FieldsetRoot>
      <FormSubmit disabled={status === 'loading'}>
        {status === 'loading' ? 'Logging in...' : 'Log in'}
      </FormSubmit>
      {status === 'success' && (
        <FormSuccess role="alert" aria-live="polite">
          Successfully logged in
        </FormSuccess>
      )}
    </FormRoot>
  );
}

const FormRoot = styled(Form)`
  width: 275px;
`;

const Input = styled(InputPrimitive)`
  border: 1px solid #ccc;
  border-radius: 4px;
  width: 100%;
  padding: 6px;
  font-size: 100%;

  &[data-invalid] {
    border-color: red;
    background-color: rgb(255 0 0 / 0.1);
  }

  &:focus {
    outline: 0;
    border-color: #0078d4;
    box-shadow: 0 0 0 3px rgba(0 100 255 / 0.3);

    &[data-invalid] {
      border-color: red;
      box-shadow: 0 0 0 3px rgba(255 0 0 / 0.3);
    }
  }
`;

const FieldError = styled(Field.Error)`
  font-size: 90%;
  margin: 0;
  margin-bottom: 0;
  margin-top: 4px;
  line-height: 1.1;
  color: red;
`;

const FormSuccess = styled('p')`
  font-size: 90%;
  margin: 0;
  padding: 0;
  margin-top: 4px;
  color: green;
`;

const FieldsetRoot = styled(Fieldset.Root)`
  border: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;

  p {
    margin: 0;
    color: grey;
    font-size: 90%;
  }
`;

const FieldsetLegend = styled(Fieldset.Legend)`
  display: block;
  font-size: 110%;
  font-weight: 600;
`;

const FormSubmit = styled('button')`
  display: block;
  margin-top: 10px;
  padding: 10px;
  width: 100%;
  font-size: 100%;
  background-color: #0078d4;
  color: white;
  border: none;
  border-radius: 4px;

  &[aria-disabled='true'] {
    background-color: #ddd;
    color: black;
  }
`;
