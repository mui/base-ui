import * as React from 'react';
import { Checkbox } from '@base-ui-components/react/checkbox';
import { CheckboxGroup } from '@base-ui-components/react/checkbox-group';

export default function ExampleCheckboxGroup() {
  return (
    <CheckboxGroup.Root
      aria-labelledby="apples"
      defaultValue={['fuji-apple']}
      className="flex flex-col gap-1"
    >
      <div className="font-medium" id="apples">
        Apples
      </div>

      <div className="flex items-center gap-2">
        <Checkbox.Root
          id="fuji-apple"
          name="fuji-apple"
          className="flex size-5 items-center justify-center rounded-sm outline-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue data-[checked]:bg-gray-900 data-[unchecked]:border data-[unchecked]:border-gray-300"
        >
          <Checkbox.Indicator className="size-3 text-gray-50 data-[unchecked]:hidden">
            <CheckIcon className="h-full w-full" />
          </Checkbox.Indicator>
        </Checkbox.Root>
        <label htmlFor="fuji-apple">Fuji</label>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox.Root
          id="gala-apple"
          name="gala-apple"
          className="flex size-5 items-center justify-center rounded-sm outline-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue data-[checked]:bg-gray-900 data-[unchecked]:border data-[unchecked]:border-gray-300"
        >
          <Checkbox.Indicator className="size-3 text-gray-50 data-[unchecked]:hidden">
            <CheckIcon className="h-full w-full" />
          </Checkbox.Indicator>
        </Checkbox.Root>
        <label htmlFor="gala-apple">Gala</label>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox.Root
          id="granny-smith-apple"
          name="granny-smith-apple"
          className="flex size-5 items-center justify-center rounded-sm outline-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue data-[checked]:bg-gray-900 data-[unchecked]:border data-[unchecked]:border-gray-300"
        >
          <Checkbox.Indicator className="size-3 text-gray-50 data-[unchecked]:hidden">
            <CheckIcon className="h-full w-full" />
          </Checkbox.Indicator>
        </Checkbox.Root>
        <label htmlFor="granny-smith-apple">Granny Smith</label>
      </div>
    </CheckboxGroup.Root>
  );
}

function CheckIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg fill="currentcolor" viewBox="0 0 9 9" {...props}>
      <path d="M8.53547 0.62293C8.88226 0.849446 8.97976 1.3142 8.75325 1.66099L4.5083 8.1599C4.38833 8.34356 4.19397 8.4655 3.9764 8.49358C3.75883 8.52167 3.53987 8.45309 3.3772 8.30591L0.616113 5.80777C0.308959 5.52987 0.285246 5.05559 0.563148 4.74844C0.84105 4.44128 1.31533 4.41757 1.62249 4.69547L3.73256 6.60459L7.49741 0.840706C7.72393 0.493916 8.18868 0.396414 8.53547 0.62293Z" />
    </svg>
  );
}
