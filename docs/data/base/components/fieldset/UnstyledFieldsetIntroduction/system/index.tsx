import * as React from 'react';
import * as Field from '@base_ui/react/Field';
import * as Fieldset from '@base_ui/react/FieldSet';
import * as Checkbox from '@base_ui/react/Checkbox';

export default function UnstyledSwitchIntroduction() {
  return (
    <Fieldset.Root>
      <Fieldset.Label>Fruits</Fieldset.Label>
      <Field.Root>
        <Checkbox.Root>
          <Checkbox.Indicator>C</Checkbox.Indicator>
        </Checkbox.Root>
        <Field.Label>Pear</Field.Label>
      </Field.Root>
      <Field.Root>
        <Checkbox.Root>
          <Checkbox.Indicator>C</Checkbox.Indicator>
        </Checkbox.Root>
        <Field.Label>Apple</Field.Label>
      </Field.Root>
      <Field.Root>
        <Checkbox.Root>
          <Checkbox.Indicator>C</Checkbox.Indicator>
        </Checkbox.Root>
        <Field.Label>Banana</Field.Label>
      </Field.Root>
    </Fieldset.Root>
  );
}
