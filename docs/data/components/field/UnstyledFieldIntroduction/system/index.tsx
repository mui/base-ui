'use client';
import * as React from 'react';
import { Field } from '@base-ui-components/react/field';
import { TextInput } from '@base-ui-components/react/input';
import { styled } from '@mui/system';

export default function UnstyledFieldIntroduction() {
  return (
    <FieldRoot validate={(value) => (value === 'admin' ? 'Name not allowed' : null)}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Field.Label>Name</Field.Label>
        <Input required pattern="[a-zA-Z0-9]+" />
      </div>
      <Field.Validity>
        {({ validity, value }) => {
          if (
            validity.valueMissing ||
            validity.patternMismatch ||
            value === 'admin'
          ) {
            return null;
          }

          return (
            <FieldDescription>
              Your name will be visible on your profile.
            </FieldDescription>
          );
        }}
      </Field.Validity>
      <FieldError match="customError" />
      <FieldError match="valueMissing" />
      <FieldError match="patternMismatch">
        Only alphanumeric characters are allowed (a-z, A-Z, 0-9).
      </FieldError>
    </FieldRoot>
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

const FieldDescription = styled(Field.Description)`
  font-size: 90%;
  margin-bottom: 0;
  margin-top: 4px;
  line-height: 1.1;
  color: grey;

  &[data-error] {
    color: red;
  }
`;

const FieldError = styled(Field.Error)`
  display: block;
  font-size: 90%;
  margin: 0;
  margin-bottom: 0;
  margin-top: 4px;
  line-height: 1.1;
  color: red;
`;
