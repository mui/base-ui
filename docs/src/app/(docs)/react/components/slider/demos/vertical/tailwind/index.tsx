import { Slider } from '@base-ui/react/slider';

export default function VerticalSlider() {
  return (
    <Slider.Root orientation="vertical" defaultValue={35}>
      <Slider.Control className="flex touch-none select-none data-[orientation=vertical]:h-32 data-[orientation=vertical]:px-3">
        <Slider.Track className="bg-gray-200 select-none dark:bg-gray-800 data-[orientation=vertical]:h-full data-[orientation=vertical]:w-1">
          <Slider.Indicator className="bg-gray-950 select-none dark:bg-white" />
          <Slider.Thumb
            aria-label="Volume"
            className="box-border size-4 border border-gray-950 bg-white select-none has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-blue-800 dark:border-white dark:bg-gray-950"
          />
        </Slider.Track>
      </Slider.Control>
    </Slider.Root>
  );
}
