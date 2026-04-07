import { Slider } from '@base-ui/react/slider';
import { DirectionProvider } from '@base-ui/react/direction-provider';

export default function ExampleDirectionProvider() {
  return (
    <div dir="rtl">
      <DirectionProvider direction="rtl">
        <Slider.Root defaultValue={25}>
          <Slider.Control className="flex w-56 items-center py-3">
            <Slider.Track className="relative h-1 w-full rounded-sm bg-gray-200 shadow-[inset_0_0_0_1px] shadow-gray-200">
              <Slider.Indicator className="rounded-sm bg-gray-700" />
              <Slider.Thumb className="size-4 rounded-full bg-white outline-1 outline-gray-300 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-blue-800" />
            </Slider.Track>
          </Slider.Control>
        </Slider.Root>
      </DirectionProvider>
    </div>
  );
}
