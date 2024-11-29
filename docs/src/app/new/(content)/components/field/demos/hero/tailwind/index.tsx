import * as React from 'react';
import { Field } from '@base-ui-components/react/field';

export default function ExampleField() {
  return (
    <Field.Root className="flex flex-col gap-2">
      <div className="flex flex-col items-start gap-1">
        <Field.Label className="text-sm font-medium text-gray-900">Name</Field.Label>
        <Field.Control
          required
          // @ts-ignore
          placeholder="Required"
          className="w-64 rounded-md border border-gray-200 px-3.5 py-2 text-gray-900 focus:outline-2 focus:-outline-offset-1 focus:outline-blue-800"
        />
        <Field.Error className="text-sm text-red-800" match="valueMissing">
          Please enter your name
        </Field.Error>
      </div>

      <Field.Description className="text-sm text-gray-600">
        Visible on your profile
      </Field.Description>
    </Field.Root>
  );
}
