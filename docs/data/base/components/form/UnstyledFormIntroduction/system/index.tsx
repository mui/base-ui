import * as React from 'react';
import * as Form from '@base_ui/react/Form';
import * as Fieldset from '@base_ui/react/Fieldset';
import * as Field from '@base_ui/react/Field';
import { styled } from '@mui/system';

type Status = 'initial' | 'loading' | 'success' | 'error';

export default function UnstyledFormIntroduction() {
  const [errors, setErrors] = React.useState({});
  const [status, setStatus] = React.useState<Status>('initial');

  return (
    <FormRoot
      errors={errors}
      onClearErrors={setErrors}
      onSubmit={async (event) => {
        event.preventDefault();

        const formData = new FormData(event.currentTarget);
        const username = formData.get('username') as string;
        const password = formData.get('password') as string;

        setStatus('loading');

        // Mimic a server request
        await new Promise((resolve) => {
          setTimeout(resolve, 500);
        });

        const isUnknownUser = username !== 'admin';
        const isInvalidPassword = password !== 'admin';

        const serverErrors: Partial<Record<'username' | 'password', string>> = {};

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
          <FieldControl required />
          <FieldError />
        </Field.Root>
        <Field.Root name="password">
          <Field.Label>Password</Field.Label>
          <FieldControl type="password" required />
          <FieldError />
        </Field.Root>
      </FieldsetRoot>
      <FieldSubmit disabled={status === 'loading'}>
        {status === 'loading' ? 'Logging in...' : 'Log in'}
      </FieldSubmit>
      {status === 'success' && (
        <FieldSuccess role="alert" aria-live="polite">
          Successfully logged in
        </FieldSuccess>
      )}
    </FormRoot>
  );
}

const FormRoot = styled(Form.Root)`
  width: 275px;
`;

const FieldControl = styled(Field.Control)`
  border: 1px solid #ccc;
  border-radius: 4px;
  width: 100%;
  padding: 6px;
  font-size: 100%;

  &[data-field='invalid'] {
    border-color: red;
    background-color: rgb(255 0 0 / 0.1);
  }

  &:focus {
    outline: 0;
    border-color: #0078d4;
    box-shadow: 0 0 0 3px rgba(0 100 255 / 0.3);

    &[data-field='invalid'] {
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

const FieldSuccess = styled(Field.Description)`
  font-size: 90%;
  margin: 0;
  padding: 0;
  margin-top: 4px;
  color: green;
`;

const FieldsetRoot = styled(Fieldset.Root)`
  border: none;
  padding: 0;
`;

const FieldsetLegend = styled(Fieldset.Legend)`
  display: block;
  font-size: 110%;
  margin-bottom: 10px;
  font-weight: 600;
`;

const FieldSubmit = styled(Form.Submit)`
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
