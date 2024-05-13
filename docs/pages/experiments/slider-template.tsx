import * as React from 'react';
import * as Slider from '@base_ui/react/Slider';
import { Styles, TrackFill } from './slider';

export default function App() {
  return (
    <div className="App">
      <Slider.Root className="MySlider" defaultValue={60}>
        <Slider.Output className="MySlider-output" />
        <Slider.Track className="MySlider-track">
          <TrackFill className="MySlider-track-fill" />
          <Slider.Thumb className="MySlider-thumb one" />
        </Slider.Track>
      </Slider.Root>
      <Styles />
    </div>
  );
}
