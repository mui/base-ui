'use client';
import * as React from 'react';
import { Field } from '@base-ui-components/react/field';
import { TextInput } from '@base-ui-components/react/text-input';
import { styled } from '@mui/system';

export default function UnstyledFieldServerError() {
  const [error, setError] = React.useState(false);
  const [status, setStatus] = React.useState('initial');

  const controlRef = React.useRef(null);

  async function handleSubmit(event) {
    event.preventDefault();

    if (error || !controlRef.current?.validity.valid) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    const email = formData.get('email');

    setStatus('loading');

    // Mimic a server request
    await new Promise((resolve) => {
      setTimeout(resolve, 1000);
    });

    if (email && email.endsWith('@example.com')) {
      setStatus('error');
      setError(true);
    } else {
      setStatus('success');
    }

    controlRef.current?.focus();
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <FieldRoot invalid={error} name="email">
        <Field.Label>Email address</Field.Label>
        <Input
          ref={controlRef}
          type="email"
          required
          onChange={() => {
            setStatus('initial');
            setError(false);
          }}
        />
        <Field.Validity>
          {(state) => (
            <FieldSubmit
              type="submit"
              aria-disabled={status === 'loading'}
              aria-description={
                !state.validity.valid ? 'Field has errors' : undefined
              }
              onClick={(event) => {
                if (status === 'loading') {
                  event.preventDefault();
                }
              }}
            >
              {status === 'loading' ? 'Processing...' : 'Change email'}
            </FieldSubmit>
          )}
        </Field.Validity>
        <FieldError />
        <FieldError forceShow={error}>@example.com is not allowed</FieldError>
        {status === 'success' && (
          <FieldSuccess role="alert" aria-live="polite">
            Email changed successfully
          </FieldSuccess>
        )}
        <FieldDescription>
          On the client, standard email validation is performed. On the server, we
          check a blocklist of email domains: the blocked domain is @example.com.
        </FieldDescription>
      </FieldRoot>
    </form>
  );
}

const FieldRoot = styled(Field.Root)`
  width: 275px;
`;

const Input = styled(TextInput)`
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
  display: block;
  font-size: 90%;
  margin: 0;
  padding: 0;
  margin-top: 10px;
  line-height: 1.1;

  &[data-dirty],
  &[data-touched] {
    color: red;
  }
`;

const FieldSuccess = styled(Field.Description)`
  font-size: 90%;
  margin: 0;
  padding: 0;
  margin-top: 10px;
  color: green;
`;

const FieldDescription = styled('p')`
  font-size: 90%;
  margin: 0;
  padding: 0;
  margin-top: 10px;
  line-height: 1.1;
  color: grey;
`;

const FieldSubmit = styled('button')`
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
