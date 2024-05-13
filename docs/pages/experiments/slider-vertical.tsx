import * as React from 'react';
import * as Slider from '@base_ui/react/Slider';
import { Styles, TrackFill } from './slider';

export default function App() {
  return (
    <div className="App">
      <Slider.Root className="VerticalSlider" defaultValue={50} orientation="vertical">
        <Slider.Output className="VerticalSlider-output" />
        <Slider.Track className="VerticalSlider-track">
          <TrackFill className="VerticalSlider-track-fill" />
          <Slider.Thumb className="VerticalSlider-thumb" />
        </Slider.Track>
      </Slider.Root>

      <Slider.Root className="VerticalSlider" defaultValue={[40, 60]} orientation="vertical">
        <Slider.Output className="VerticalSlider-output" />
        <Slider.Track className="VerticalSlider-track">
          <TrackFill className="VerticalSlider-track-fill" />
          <Slider.Thumb className="VerticalSlider-thumb" />
          <Slider.Thumb className="VerticalSlider-thumb" />
        </Slider.Track>
      </Slider.Root>
      <Styles />
    </div>
  );
}
