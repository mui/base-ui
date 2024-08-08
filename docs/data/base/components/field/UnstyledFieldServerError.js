import * as React from 'react';
import * as Field from '@base_ui/react/Field';
import { styled } from '@mui/system';

export default function UnstyledFieldServerError() {
  const [error, setError] = React.useState(false);
  const [status, setStatus] = React.useState('initial');

  async function handleSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const name = formData.get('name');

    setStatus('loading');

    // Mimic a server request
    await new Promise((resolve) => {
      setTimeout(resolve, 1000);
    });

    if (name === 'admin') {
      setStatus('error');
      setError(true);
    } else {
      setStatus('success');
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <FieldRoot invalid={error} validateOnChange>
        <Field.Label>Name</Field.Label>
        <FieldControl
          name="name"
          required
          onChange={() => {
            setStatus('initial');
            setError(false);
          }}
        />
        <FieldDescription>
          All names except `admin` are allowed. Check is performed on the server.
        </FieldDescription>
        <FieldSubmit
          type="submit"
          aria-disabled={status === 'loading'}
          onClick={(event) => {
            if (status === 'loading') {
              event.preventDefault();
            }
          }}
        >
          {status === 'loading' ? 'Processing...' : 'Change name'}
        </FieldSubmit>
        <FieldError forceShow={error}>Name not allowed</FieldError>
        {status === 'success' && (
          <FieldSuccess>Name changed successfully</FieldSuccess>
        )}
      </FieldRoot>
    </form>
  );
}

const FieldRoot = styled(Field.Root)`
  width: 275px;
`;

const FieldControl = styled(Field.Control)`
  border: 1px solid #ccc;
  border-radius: 4px;
  width: 100%;
  padding: 6px;
  font-size: 100%;

  &[data-field='invalid'][data-dirty] {
    border-color: red;
    background-color: #fff0f0;
  }

  &:focus {
    outline: 0;
    border-color: #0078d4;
    box-shadow: 0 0 0 3px rgba(0 100 255 / 0.3);

    &[data-field='invalid'][data-dirty] {
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

const FieldDescription = styled(Field.Description)`
  font-size: 90%;
  margin: 0;
  padding: 0;
  margin-top: 10px;
  line-height: 1.1;
  color: #666;
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
