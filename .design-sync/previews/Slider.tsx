import { Slider } from '@base-ui/react';
import './Slider.css';

export const Basic = () => (
  <Slider.Root defaultValue={25}>
    <Slider.Control className="Control">
      <Slider.Track className="Track">
        <Slider.Indicator className="Indicator" />
        <Slider.Thumb aria-label="Volume" className="Thumb" />
      </Slider.Track>
    </Slider.Control>
  </Slider.Root>
);

export const Range = () => (
  <Slider.Root defaultValue={[25, 45]}>
    <Slider.Control className="Control">
      <Slider.Track className="Track">
        <Slider.Indicator className="Indicator" />
        <Slider.Thumb index={0} aria-label="Minimum value" className="Thumb" />
        <Slider.Thumb index={1} aria-label="Maximum value" className="Thumb" />
      </Slider.Track>
    </Slider.Control>
  </Slider.Root>
);

export const Disabled = () => (
  <Slider.Root defaultValue={40} disabled>
    <Slider.Control className="Control">
      <Slider.Track className="Track">
        <Slider.Indicator className="Indicator" />
        <Slider.Thumb aria-label="Volume" className="Thumb" />
      </Slider.Track>
    </Slider.Control>
  </Slider.Root>
);
