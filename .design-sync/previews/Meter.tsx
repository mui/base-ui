import { Meter } from '@base-ui/react';
import './Meter.css';

export const Basic = () => (
  <Meter.Root className="Meter" value={24}>
    <Meter.Label className="Label">Storage Used</Meter.Label>
    <Meter.Value className="Value" />
    <Meter.Track className="Track">
      <Meter.Indicator className="Indicator" />
    </Meter.Track>
  </Meter.Root>
);

export const Mid = () => (
  <Meter.Root className="Meter" value={58}>
    <Meter.Label className="Label">Storage Used</Meter.Label>
    <Meter.Value className="Value" />
    <Meter.Track className="Track">
      <Meter.Indicator className="Indicator" />
    </Meter.Track>
  </Meter.Root>
);

export const High = () => (
  <Meter.Root className="Meter" value={92}>
    <Meter.Label className="Label">Storage Used</Meter.Label>
    <Meter.Value className="Value" />
    <Meter.Track className="Track">
      <Meter.Indicator className="Indicator" />
    </Meter.Track>
  </Meter.Root>
);
