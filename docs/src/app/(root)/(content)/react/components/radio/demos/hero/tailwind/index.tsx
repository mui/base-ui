import * as React from 'react';
import { Radio } from '@base-ui-components/react/radio';
import { RadioGroup } from '@base-ui-components/react/radio-group';

export default function ExampleRadioGroup() {
  return (
    <RadioGroup
      aria-labelledby="apples-caption"
      defaultValue="fuji-apple"
      className="flex flex-col items-start gap-1 text-gray-900"
    >
      <div className="font-medium" id="apples-caption">
        Best apple
      </div>

      <label className="flex items-center gap-2">
        <Radio.Root
          value="fuji-apple"
          className="flex size-5 items-center justify-center rounded-full outline-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800 data-[checked]:bg-gray-900 data-[unchecked]:border data-[unchecked]:border-gray-300"
        >
          <Radio.Indicator className="flex before:size-2 before:rounded-full before:bg-gray-50 data-[unchecked]:hidden" />
        </Radio.Root>
        Fuji
      </label>

      <label className="flex items-center gap-2">
        <Radio.Root
          value="gala-apple"
          className="flex size-5 items-center justify-center rounded-full outline-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800 data-[checked]:bg-gray-900 data-[unchecked]:border data-[unchecked]:border-gray-300"
        >
          <Radio.Indicator className="flex before:size-2 before:rounded-full before:bg-gray-50 data-[unchecked]:hidden" />
        </Radio.Root>
        Gala
      </label>

      <label className="flex items-center gap-2">
        <Radio.Root
          value="granny-smith-apple"
          className="flex size-5 items-center justify-center rounded-full outline-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800 data-[checked]:bg-gray-900 data-[unchecked]:border data-[unchecked]:border-gray-300"
        >
          <Radio.Indicator className="flex before:size-2 before:rounded-full before:bg-gray-50 data-[unchecked]:hidden" />
        </Radio.Root>
        Granny Smith
      </label>
    </RadioGroup>
  );
}
