import * as React from 'react';
import { Field } from '@base-ui/react';
import './Field.css';

export const Basic = () => (
  <Field.Root className="Field">
    <Field.Label className="Label">Name</Field.Label>
    <Field.Control required placeholder="Required" className="Input" />

    <Field.Error className="Error" match="valueMissing">
      Please enter your name
    </Field.Error>

    <Field.Description className="Description">Visible on your profile</Field.Description>
  </Field.Root>
);

export const Invalid = () => (
  <Field.Root className="Field" invalid>
    <Field.Label className="Label">Email</Field.Label>
    <Field.Control
      defaultValue="not-an-email"
      aria-invalid
      className="Input"
    />
    <Field.Error className="Error">Please enter a valid email address</Field.Error>
  </Field.Root>
);

export const Disabled = () => (
  <Field.Root className="Field" disabled>
    <Field.Label className="Label">Company</Field.Label>
    <Field.Control defaultValue="Acme Inc." className="Input" />
    <Field.Description className="Description">Managed by your organization</Field.Description>
  </Field.Root>
);
