import { Meter } from '@base-ui/react/meter';

export default function ExampleMeter() {
  return (
    <Meter.Root className="grid max-w-full w-60 grid-cols-2 gap-y-2" value={24}>
      <Meter.Label className="text-sm leading-5 font-normal text-gray-900 dark:text-white">
        Storage Used
      </Meter.Label>
      <Meter.Value className="text-right text-sm leading-5 text-gray-900 dark:text-white" />
      <Meter.Track className="col-span-2 h-3 overflow-hidden bg-gray-200 dark:bg-gray-800">
        <Meter.Indicator className="bg-gray-900 transition-[width] duration-500 dark:bg-white" />
      </Meter.Track>
    </Meter.Root>
  );
}
