// https://github.com/mui/material-ui/issues/41739
// to cross check whether this issue would still occur in the new API
import * as React from 'react';
import * as Slider from '@base_ui/react/Slider';
import { Styles } from './slider';

export default function App() {
  const [val1, setVal1] = React.useState(80);
  const [val2, setVal2] = React.useState<number | null>(null);

  return (
    <div
      style={{
        fontFamily: 'system-ui, sans-serif',
        width: '40rem',
      }}
    >
      <Slider.Root
        className="MySlider"
        value={val1}
        onValueChange={(newValue) => setVal1(newValue as number)}
        onValueCommitted={(newValue) => setVal2(newValue as number)}
      >
        <Slider.Output className="MySlider-output" />
        <Slider.Track className="MySlider-track">
          <Slider.Indicator className="MySlider-indicator" />
          <Slider.Thumb className="MySlider-thumb one" />
        </Slider.Track>
      </Slider.Root>

      <pre>onValueChange value: {val1}</pre>
      <pre>onValueCommitted value: {val2}</pre>
      <Styles />
    </div>
  );
}
