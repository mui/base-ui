import * as React from 'react';
import * as Slider from '@base_ui/react/Slider';
import { Styles } from './slider';

export default function App() {
  return (
    <div className="App">
      <Slider.Root className="MySlider" defaultValue={50} direction="rtl">
        <Slider.Output className="MySlider-output" />
        <Slider.Control className="MySlider-control">
          <Slider.Track className="MySlider-track">
            <Slider.Indicator className="MySlider-indicator" />
            <Slider.Thumb className="MySlider-thumb one" />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>

      <Slider.Root
        className="VerticalSlider"
        defaultValue={50}
        direction="rtl"
        orientation="vertical"
      >
        <Slider.Output className="VerticalSlider-output" />
        <Slider.Control className="VerticalSlider-control">
          <Slider.Track className="VerticalSlider-track">
            <Slider.Indicator className="VerticalSlider-indicator" />
            <Slider.Thumb className="VerticalSlider-thumb one" />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>

      <Slider.Root className="MySlider" defaultValue={[50, 70]} direction="rtl">
        <Slider.Output className="MySlider-output" />
        <Slider.Control className="MySlider-control">
          <Slider.Track className="MySlider-track">
            <Slider.Indicator className="MySlider-indicator" />
            <Slider.Thumb className="MySlider-thumb one" />
            <Slider.Thumb className="MySlider-thumb two" />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>

      <Slider.Root
        className="VerticalSlider"
        defaultValue={[50, 70]}
        direction="rtl"
        orientation="vertical"
      >
        <Slider.Output className="VerticalSlider-output" />
        <Slider.Control className="VerticalSlider-control">
          <Slider.Track className="VerticalSlider-track">
            <Slider.Indicator className="VerticalSlider-indicator" />
            <Slider.Thumb className="VerticalSlider-thumb one" />
            <Slider.Thumb className="VerticalSlider-thumb two" />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>
      <Styles />
    </div>
  );
}
