import { Slider } from '@base-ui/react/slider';
import { Field } from '@base-ui/react/field';

export default function ExampleSlider() {
  return (
    <Field.Root
      render={<Slider.Root defaultValue={25} className="grid w-56 grid-cols-2 gap-y-2" />}
    >
      <Field.Label className="text-sm font-medium text-gray-900">Volume</Field.Label>
      <Slider.Value className="col-start-2 text-right text-sm text-gray-900" />

      <Slider.Control className="col-span-full flex touch-none items-center py-1 select-none">
        <Slider.Track className="h-1 w-full rounded bg-gray-200 shadow-[inset_0_0_0_1px] shadow-gray-200 select-none">
          <Slider.Indicator className="rounded bg-gray-700 select-none" />
          <Slider.Thumb className="size-4 rounded-full bg-white outline outline-1 outline-gray-300 select-none has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-blue-800" />
        </Slider.Track>
      </Slider.Control>
    </Field.Root>
  );
}
