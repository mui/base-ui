import { Slider } from '@base-ui/react/slider';

export default function StepsSlider() {
  return (
    <Slider.Root
      className="grid w-56 grid-cols-2"
      defaultValue={400}
      min={100}
      max={900}
      step={100}
      largeStep={200}
    >
      <Slider.Label className="text-sm text-neutral-950 dark:text-white">
        Playback speed
      </Slider.Label>
      <Slider.Value className="text-end text-sm text-neutral-950 dark:text-white" />
      <Slider.Control className="col-span-2 flex touch-none items-center py-3 select-none">
        <Slider.Track className="h-1 w-full bg-neutral-200 select-none dark:bg-neutral-800">
          <Slider.Indicator className="bg-neutral-950 select-none dark:bg-white" />
          <Slider.Thumb
            aria-label="Font weight"
            className="size-4 border border-neutral-950 bg-white select-none has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-neutral-950 dark:has-[:focus-visible]:outline-white dark:border-white dark:bg-neutral-950"
          />
        </Slider.Track>
      </Slider.Control>
    </Slider.Root>
  );
}
