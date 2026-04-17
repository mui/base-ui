'use client';
import * as React from 'react';
import { Radio } from '@base-ui/react/radio';
import { RadioGroup } from '@base-ui/react/radio-group';

export default function ExampleRadioGroup() {
  const id = React.useId();
  return (
    <RadioGroup
      aria-labelledby={id}
      defaultValue="fuji-apple"
      className="flex flex-col items-start gap-1 text-gray-900 dark:text-gray-50"
    >
      <div className="text-sm leading-5 font-bold" id={id}>
        Best apple
      </div>

      <label className="flex items-center gap-2 text-sm leading-5 font-normal text-gray-900 dark:text-gray-50">
        <Radio.Root
          value="fuji-apple"
          className="flex size-4 items-center justify-center border rounded-full p-0 border-gray-900 bg-gray-50 text-gray-50 dark:border-gray-50 dark:bg-gray-900 dark:text-gray-900 data-checked:bg-gray-900 data-checked:text-gray-50 dark:data-checked:bg-gray-50 dark:data-checked:text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <Radio.Indicator className="flex items-center justify-center data-unchecked:hidden before:size-2 before:rounded-full before:bg-current" />
        </Radio.Root>
        Fuji
      </label>

      <label className="flex items-center gap-2 text-sm leading-5 font-normal text-gray-900 dark:text-gray-50">
        <Radio.Root
          value="gala-apple"
          className="flex size-4 items-center justify-center border rounded-full p-0 border-gray-900 bg-gray-50 text-gray-50 dark:border-gray-50 dark:bg-gray-900 dark:text-gray-900 data-checked:bg-gray-900 data-checked:text-gray-50 dark:data-checked:bg-gray-50 dark:data-checked:text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <Radio.Indicator className="flex items-center justify-center data-unchecked:hidden before:size-2 before:rounded-full before:bg-current" />
        </Radio.Root>
        Gala
      </label>

      <label className="flex items-center gap-2 text-sm leading-5 font-normal text-gray-900 dark:text-gray-50">
        <Radio.Root
          value="granny-smith-apple"
          className="flex size-4 items-center justify-center border rounded-full p-0 border-gray-900 bg-gray-50 text-gray-50 dark:border-gray-50 dark:bg-gray-900 dark:text-gray-900 data-checked:bg-gray-900 data-checked:text-gray-50 dark:data-checked:bg-gray-50 dark:data-checked:text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <Radio.Indicator className="flex items-center justify-center data-unchecked:hidden before:size-2 before:rounded-full before:bg-current" />
        </Radio.Root>
        Granny Smith
      </label>
    </RadioGroup>
  );
}
