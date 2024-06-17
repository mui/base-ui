import * as React from 'react';
import * as Slider from '@base_ui/react/Slider';
import { Styles } from './slider';

export default function App() {
  return (
    <div className="App">
      <Slider.Root className="VerticalSlider" defaultValue={50} orientation="vertical">
        <Slider.Output className="VerticalSlider-output" />
        <Slider.Control className="VerticalSlider-control">
          <Slider.Indicator className="VerticalSlider-indicator" />
          <Slider.Thumb className="VerticalSlider-thumb" />
        </Slider.Control>
      </Slider.Root>

      <Slider.Root className="VerticalSlider" defaultValue={[40, 60]} orientation="vertical">
        <Slider.Output className="VerticalSlider-output" />
        <Slider.Control className="VerticalSlider-control">
          <Slider.Indicator className="VerticalSlider-indicator" />
          <Slider.Thumb className="VerticalSlider-thumb" />
          <Slider.Thumb className="VerticalSlider-thumb" />
        </Slider.Control>
      </Slider.Root>
      <Styles />
    </div>
  );
}
