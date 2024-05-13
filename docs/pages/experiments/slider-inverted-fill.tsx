import * as React from 'react';
import * as Slider from '@base_ui/react/Slider';
import { Styles, TrackFill } from './slider';

export default function App() {
  return (
    <div className="App">
      <Slider.Root className="MySlider" defaultValue={50}>
        <Slider.Output className="MySlider-output" />
        <Slider.Track className="MySlider-track">
          <TrackFill className="MySlider-track-fill" inverted />
          <Slider.Thumb className="MySlider-thumb one" />
        </Slider.Track>
      </Slider.Root>

      <Slider.Root className="VerticalSlider" defaultValue={50} orientation="vertical">
        <Slider.Output className="VerticalSlider-output" />
        <Slider.Track className="VerticalSlider-track">
          <TrackFill className="VerticalSlider-track-fill" inverted />
          <Slider.Thumb className="VerticalSlider-thumb" />
        </Slider.Track>
      </Slider.Root>
      <Styles />
    </div>
  );
}
