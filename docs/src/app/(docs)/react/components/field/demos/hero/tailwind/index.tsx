import { Field } from '@base-ui/react/field';

export default function ExampleField() {
  return (
    <Field.Root className="flex w-full max-w-64 flex-col items-start gap-1">
      <Field.Label className="text-sm font-bold text-gray-950 dark:text-white">Name</Field.Label>
      <Field.Control
        required
        placeholder="Required"
        className="h-8 self-stretch border border-gray-950 bg-transparent px-2 text-sm font-normal text-gray-950 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-blue-800 dark:border-white dark:text-white dark:placeholder:text-gray-400"
      />
      <Field.Error className="text-sm text-red-700 dark:text-red-400" match="valueMissing">
        Please enter your name
      </Field.Error>

      <Field.Description className="text-sm text-gray-500 dark:text-gray-400">
        Visible on your profile
      </Field.Description>
    </Field.Root>
  );
}
