'use client';
import * as React from 'react';
import { Field } from '@base-ui-components/react/field';
import { Fieldset } from '@base-ui-components/react/fieldset';
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
        <FieldControl render={<textarea data-textarea />} />
      </Field.Root>
    </FieldsetRoot>
  );
}

const FieldsetRoot = styled(Fieldset.Root)`
  border: none;
  width: 300px;
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

  &[data-textarea] {
    min-width: 300px;
    max-width: 300px;
    min-height: 100px;
  }
`;
