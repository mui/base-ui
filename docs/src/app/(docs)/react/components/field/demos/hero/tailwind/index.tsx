import { Field } from '@base-ui/react/field';

export default function ExampleField() {
  return (
    <Field.Root className="flex w-full max-w-64 flex-col items-start gap-1">
      <Field.Label className="text-sm font-medium text-gray-900">Name</Field.Label>
      <Field.Control
        required
        placeholder="Required"
        className="h-10 w-full rounded-md border border-gray-200 pl-3.5 text-base text-gray-900 focus:outline-2 focus:-outline-offset-1 focus:outline-blue-800"
      />
      <Field.Error className="text-sm text-red-800" match="valueMissing">
        Please enter your name
      </Field.Error>

      <Field.Description className="text-sm text-gray-600">
        Visible on your profile
      </Field.Description>
    </Field.Root>
  );
}
