import { Field } from '@base-ui/react/field';
import { Fieldset } from '@base-ui/react/fieldset';

export default function ExampleField() {
  return (
    <Fieldset.Root className="flex w-full max-w-64 flex-col gap-4">
      <Fieldset.Legend className="border-b border-gray-950 text-base font-bold text-gray-950 dark:border-white dark:text-white">
        Billing details
      </Fieldset.Legend>

      <Field.Root className="flex flex-col items-start gap-1">
        <Field.Label className="text-sm font-bold text-gray-950 dark:text-white">
          Company
        </Field.Label>
        <Field.Control
          placeholder="Enter company name"
          className="h-8 w-full border border-gray-950 bg-transparent px-2 text-sm font-normal text-gray-950 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-blue-800 dark:border-white dark:text-white dark:placeholder:text-gray-400"
        />
      </Field.Root>

      <Field.Root className="flex flex-col items-start gap-1">
        <Field.Label className="text-sm font-bold text-gray-950 dark:text-white">
          Tax ID
        </Field.Label>
        <Field.Control
          placeholder="Enter fiscal number"
          className="h-8 w-full border border-gray-950 bg-transparent px-2 text-sm font-normal text-gray-950 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-blue-800 dark:border-white dark:text-white dark:placeholder:text-gray-400"
        />
      </Field.Root>
    </Fieldset.Root>
  );
}
