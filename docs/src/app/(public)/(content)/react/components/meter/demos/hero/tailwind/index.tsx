import { Meter } from '@base-ui/react/meter';

export default function ExampleMeter() {
  return (
    <Meter.Root className="box-border grid w-48 grid-cols-2 gap-y-2" value={24}>
      <Meter.Label className="text-sm font-medium text-gray-900">Storage Used</Meter.Label>
      <Meter.Value className="col-start-2 m-0 text-right text-sm leading-5 text-gray-900" />
      <Meter.Track className="col-span-2 block h-2 w-48 overflow-hidden bg-gray-100 shadow-[inset_0_0_0_1px] shadow-gray-200">
        <Meter.Indicator className="block bg-gray-500 transition-all duration-500" />
      </Meter.Track>
    </Meter.Root>
  );
}
