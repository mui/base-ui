import * as React from 'react';
import { Field } from '@base-ui/react/field';

export default function InputValidateOnChange() {
  return (
    <Field.Root
      validationMode="onChange"
      validate={(val) => (val === 'abcd' ? 'custom error' : null)}
      className="flex flex-col items-start gap-1"
    >
      <Field.Control
        required
        minLength={3}
        defaultValue=""
        className="h-10 w-full rounded-md border border-gray-200 pl-3.5 text-base text-gray-900 focus:outline-2 focus:-outline-offset-1 focus:outline-blue-800"
      />
      <Field.Error data-testid="error" className="text-sm text-red-800" match="valueMissing">
        valueMissing error
      </Field.Error>
      <Field.Error data-testid="error" className="text-sm text-red-800" match="tooShort">
        tooShort error
      </Field.Error>
      <Field.Error data-testid="error" className="text-sm text-red-800" match="customError" />
    </Field.Root>
  );
}
