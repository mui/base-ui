'use client';
import * as React from 'react';
import { Field } from '@base-ui-components/react/field';
import { Checkbox } from '@base-ui-components/react/checkbox';
import { Radio } from '@base-ui-components/react/radio';
import { RadioGroup } from '@base-ui-components/react/radio-group';

function CheckboxDemo() {
  return (
    <Field.Root style={{ display: 'flex', gap: 10 }}>
      <Field.Label>Checkbox</Field.Label>
      <Checkbox.Root required style={{ width: 20, height: 20, padding: 0 }}>
        <Checkbox.Indicator>+</Checkbox.Indicator>
      </Checkbox.Root>
      <Field.Error style={{ color: 'red' }} />
    </Field.Root>
  );
}

export default function FieldControls() {
  return (
    <div>
      <CheckboxDemo />

      <Field.Root
        validationMode="onChange"
        validate={(value) => {
          return value === '1' ? 'error' : null;
        }}
      >
        <RadioGroup data-testid="group">
          <Radio.Root value="1">One</Radio.Root>
          <Radio.Root value="2">Two</Radio.Root>
        </RadioGroup>
      </Field.Root>
    </div>
  );
}
