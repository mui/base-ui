import * as React from 'react';
import * as Field from '@base_ui/react/Field';
import { styled } from '@mui/system';

const cache = new Map();

function checkAvailability(name) {
  const takenNames = ['admin', 'root', 'superuser'];
  return new Promise((resolve) => {
    setTimeout(() => {
      const result = takenNames.includes(name) ? 'Name taken' : null;
      cache.set(name, result);
      resolve(result);
    }, 500);
  });
}

export default function UnstyledFieldAsync() {
  const [loading, setLoading] = React.useState(false);

  return (
    <div>
      <h3>Handle availability checker</h3>
      <FieldRoot
        validate={async (value) => {
          const name = value;

          if (name === '') {
            return null;
          }

          const isCached = cache.has(name);
          if (isCached) {
            return cache.get(name);
          }

          setLoading(true);

          try {
            const error = await checkAvailability(name);
            setLoading(false);
            return error;
          } catch (e) {
            setLoading(false);
            return 'Failed to fetch name availability';
          }
        }}
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
              return <FieldMessage>Checking availability...</FieldMessage>;
            }

            if (state.value === '') {
              return <FieldMessage>Enter a name</FieldMessage>;
            }

            if (!state.validity.customError) {
              return (
                <FieldMessage data-type="success">
                  <strong>@{state.value}</strong> is available
                </FieldMessage>
              );
            }

            return <FieldMessage data-type="error" show="customError" />;
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

  &[data-invalid] {
    border-color: red;
    background-color: #fffbfb;
  }

  &[data-valid]:not([data-pending]) {
    border-color: green;
    background-color: #f0fff0;
  }

  &:focus {
    outline: 0;
    border-color: #0078d4;
    box-shadow: 0 0 0 3px rgba(0 100 255 / 0.3);

    &[data-invalid] {
      box-shadow: 0 0 0 3px rgba(255 0 0 / 0.3);
    }

    &[data-valid]:not([data-pending]) {
      box-shadow: 0 0 0 3px rgba(100 200 100 / 0.3);
    }
  }
`;

const FieldMessage = styled(Field.Message)`
  font-size: 90%;
  margin: 0;
  margin-top: 4px;
  line-height: 1.1;
  color: #666;

  &[data-type='error'] {
    color: red;
  }

  &[data-type='success'] {
    color: green;
  }
`;
