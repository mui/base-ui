import * as React from 'react';
import { Field } from '@base-ui-components/react/field';
import { Checkbox } from '@base-ui-components/react/checkbox';

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
    </div>
  );
}
