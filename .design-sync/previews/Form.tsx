import * as React from 'react';
import { Field, Form, Button } from '@base-ui/react';
import './Form.css';

export const Basic = () => (
  <Form className="Form">
    <Field.Root name="url" className="Field">
      <Field.Label className="Label">Homepage</Field.Label>
      <Field.Control
        type="url"
        required
        defaultValue="https://example.com"
        placeholder="https://example.com"
        pattern="https?://.*"
        className="Input"
      />
      <Field.Error className="Error" />
    </Field.Root>
    <Button type="submit" className="SubmitButton">
      Submit
    </Button>
  </Form>
);

export const ValidationError = () => (
  <Form className="Form" errors={{ url: 'The example domain is not allowed' }}>
    <Field.Root name="url" className="Field">
      <Field.Label className="Label">Homepage</Field.Label>
      <Field.Control
        type="url"
        required
        defaultValue="https://example.com"
        aria-invalid
        className="Input"
      />
      <Field.Error className="Error">The example domain is not allowed</Field.Error>
    </Field.Root>
    <Button type="submit" className="SubmitButton">
      Submit
    </Button>
  </Form>
);
