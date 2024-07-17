import * as React from 'react';
import { styled } from '@mui/system';
import * as Field from '@base_ui/react/Field';

export default function UnstyledFieldIntroduction() {
  return (
    <Field.Root style={{ width: 250 }} disabled>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Field.Label>Name</Field.Label>
        <FieldControl required pattern="[a-zA-Z0-9]+" />
      </div>
      <Field.Validity>
        {(validity, value) => {
          if (
            !validity.valueMissing &&
            !validity.patternMismatch &&
            value !== 'admin'
          ) {
            return (
              <FieldMessage>Your name will be visible on your profile.</FieldMessage>
            );
          }

          return null;
        }}
      </Field.Validity>
      <FieldMessage data-error show="valueMissing" />
      <FieldMessage data-error show={(value) => value === 'admin'}>
        Name not allowed.
      </FieldMessage>
      <FieldMessage data-error show="patternMismatch">
        Only alphanumeric characters are allowed (a-z, A-Z, 0-9).
      </FieldMessage>
    </Field.Root>
  );
}

const FieldControl = styled(Field.Control)`
  padding: 4px 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  width: 100%;
  padding: 6px;
`;

const FieldMessage = styled(Field.Message)`
  font-size: 90%;
  margin: 0;
  margin-top: 4px;
  line-height: 1.1;
  color: #666;

  &[data-error] {
    color: red;
  }
`;
