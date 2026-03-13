import { Field } from '@base-ui/react/field';
import { Fieldset } from '@base-ui/react/fieldset';

export default function ExampleField() {
  return (
    <Fieldset.Root className="flex w-full max-w-64 flex-col gap-4">
      <Fieldset.Legend className="border-b border-gray-200 pb-3 text-lg font-medium text-gray-900">
        Billing details
      </Fieldset.Legend>

      <Field.Root className="flex flex-col items-start gap-1">
        <Field.Label className="text-sm font-medium text-gray-900">Company</Field.Label>
        <Field.Control
          placeholder="Enter company name"
          className="h-10 w-full rounded-md border border-gray-200 pl-3.5 text-base text-gray-900 focus:outline-2 focus:-outline-offset-1 focus:outline-blue-800"
        />
      </Field.Root>

      <Field.Root className="flex flex-col items-start gap-1">
        <Field.Label className="text-sm font-medium text-gray-900">Tax ID</Field.Label>
        <Field.Control
          placeholder="Enter fiscal number"
          className="h-10 w-full rounded-md border border-gray-200 pl-3.5 text-base text-gray-900 focus:outline-2 focus:-outline-offset-1 focus:outline-blue-800"
        />
      </Field.Root>
    </Fieldset.Root>
  );
}
