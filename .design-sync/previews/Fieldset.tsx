import * as React from 'react';
import { Field, Fieldset } from '@base-ui/react';
import './Fieldset.css';

export const Basic = () => (
  <Fieldset.Root className="Fieldset">
    <Fieldset.Legend className="Legend">Billing details</Fieldset.Legend>

    <Field.Root className="Field">
      <Field.Label className="Label">Company</Field.Label>
      <Field.Control placeholder="Enter company name" className="Input" />
    </Field.Root>

    <Field.Root className="Field">
      <Field.Label className="Label">Tax ID</Field.Label>
      <Field.Control placeholder="Enter fiscal number" className="Input" />
    </Field.Root>
  </Fieldset.Root>
);

export const Disabled = () => (
  <Fieldset.Root className="Fieldset" disabled>
    <Fieldset.Legend className="Legend">Billing details</Fieldset.Legend>

    <Field.Root className="Field">
      <Field.Label className="Label">Company</Field.Label>
      <Field.Control defaultValue="Acme Inc." className="Input" />
    </Field.Root>

    <Field.Root className="Field">
      <Field.Label className="Label">Tax ID</Field.Label>
      <Field.Control defaultValue="12-3456789" className="Input" />
    </Field.Root>
  </Fieldset.Root>
);
