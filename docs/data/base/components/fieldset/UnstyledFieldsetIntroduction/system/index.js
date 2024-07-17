import * as React from 'react';
import * as Field from '@base_ui/react/Field';
import * as Fieldset from '@base_ui/react/Fieldset';
import { styled } from '@mui/system';

export default function UnstyledFieldsetIntroduction() {
  return (
    <FieldsetRoot>
      <FieldsetLegend>Account details</FieldsetLegend>
      <Field.Root>
        <Field.Label>Name</Field.Label>
        <FieldControl />
      </Field.Root>
      <Field.Root>
        <Field.Label>Address</Field.Label>
        <FieldControl />
      </Field.Root>
      <Field.Root>
        <Field.Label>Bio</Field.Label>
        <FieldControl render={<textarea />} />
      </Field.Root>
    </FieldsetRoot>
  );
}

const FieldsetRoot = styled(Fieldset.Root)`
  border: none;
`;

const FieldsetLegend = styled(Fieldset.Legend)`
  display: inline-block;
  font-size: 125%;
  font-weight: bold;
  margin-bottom: 10px;
`;

const FieldControl = styled(Field.Control)`
  border: 1px solid #ccc;
  border-radius: 4px;
  width: 100%;
  padding: 6px;
  margin-bottom: 5px;
`;
