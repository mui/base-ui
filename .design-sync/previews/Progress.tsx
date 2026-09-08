import { Progress } from '@base-ui/react';
import './Progress.css';

export const Basic = () => (
  <Progress.Root className="Progress" value={20}>
    <Progress.Label className="Label">Export data</Progress.Label>
    <Progress.Value className="Value" />
    <Progress.Track className="Track">
      <Progress.Indicator className="Indicator" />
    </Progress.Track>
  </Progress.Root>
);

export const Mid = () => (
  <Progress.Root className="Progress" value={65}>
    <Progress.Label className="Label">Export data</Progress.Label>
    <Progress.Value className="Value" />
    <Progress.Track className="Track">
      <Progress.Indicator className="Indicator" />
    </Progress.Track>
  </Progress.Root>
);

export const Complete = () => (
  <Progress.Root className="Progress" value={100}>
    <Progress.Label className="Label">Export data</Progress.Label>
    <Progress.Value className="Value" />
    <Progress.Track className="Track">
      <Progress.Indicator className="Indicator" />
    </Progress.Track>
  </Progress.Root>
);

export const Indeterminate = () => (
  <Progress.Root className="Progress" value={null}>
    <Progress.Label className="Label">Export data</Progress.Label>
    <Progress.Value className="Value" />
    <Progress.Track className="Track">
      <Progress.Indicator className="Indicator" />
    </Progress.Track>
  </Progress.Root>
);
