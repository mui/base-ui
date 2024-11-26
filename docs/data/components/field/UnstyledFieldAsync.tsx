'use client';
import * as React from 'react';
import { Field } from '@base-ui-components/react/field';
import { styled } from '@mui/system';

const cache = new Map<string, string | null>();

function checkAvailability(name: string) {
  const takenNames = ['admin', 'root', 'superuser'];
  return new Promise<string | null>((resolve) => {
    setTimeout(() => {
      const result = takenNames.includes(name) ? 'Name taken' : null;
      cache.set(name, result);
      resolve(result);
    }, 500);
  });
}

export default function UnstyledFieldAsync() {
  const [loading, setLoading] = React.useState(false);

  async function handleValidate(value: unknown) {
    const name = value as string;

    if (name === '') {
      return null;
    }

    const isCached = cache.has(name);
    if (isCached) {
      return cache.get(name) as string | null;
    }

    setLoading(true);

    try {
      const error = await checkAvailability(name);
      setLoading(false);
      return error;
    } catch {
      setLoading(false);
      return 'Failed to fetch name availability';
    }
  }

  return (
    <div>
      <h3>Handle availability checker</h3>
      <FieldRoot
        validate={handleValidate}
        validationMode="onChange"
        validationDebounceTime={300}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Field.Label>@</Field.Label>
          <Field.Validity>
            {(state) => (
              <FieldControl
                data-pending={state.value === '' || loading || undefined}
              />
            )}
          </Field.Validity>
        </div>
        <Field.Validity>
          {(state) => {
            if (loading) {
              return <FieldDescription>Checking availability...</FieldDescription>;
            }

            if (!state.value) {
              return <FieldDescription>Enter a name</FieldDescription>;
            }

            if (!state.validity.customError) {
              return (
                <FieldDescription
                  data-type="success"
                  role="alert"
                  aria-live="polite"
                >
                  <strong>@{state.value as string}</strong> is available
                </FieldDescription>
              );
            }

            return <FieldError match="customError" />;
          }}
        </Field.Validity>
      </FieldRoot>
    </div>
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

  &[data-invalid]:not([data-pending]) {
    border-color: red;
    background-color: rgb(255 0 0 / 0.1);
  }

  &[data-valid]:not([data-pending]) {
    border-color: green;
    background-color: rgb(0 255 0 / 0.1);
  }

  &:focus {
    outline: 0;
    border-color: #0078d4;
    box-shadow: 0 0 0 3px rgba(0 100 255 / 0.3);

    &[data-invalid]:not([data-pending]) {
      border-color: red;
      box-shadow: 0 0 0 3px rgba(255 0 0 / 0.3);
    }

    &[data-valid]:not([data-pending]) {
      box-shadow: 0 0 0 3px rgba(100 200 100 / 0.3);
    }
  }
`;

const FieldDescription = styled(Field.Description)`
  font-size: 90%;
  margin: 0;
  margin-top: 4px;
  line-height: 1.1;
  color: grey;

  &[data-type='success'] {
    color: green;
  }
`;

const FieldError = styled(Field.Error)`
  display: block;
  font-size: 90%;
  margin: 0;
  margin-top: 4px;
  line-height: 1.1;
  color: red;
`;
