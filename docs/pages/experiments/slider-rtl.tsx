import * as React from 'react';
import * as Slider from '@base_ui/react/Slider';
import { Styles, TrackFill } from './slider';

export default function App() {
  return (
    <div className="App">
      <Slider.Root className="MySlider" defaultValue={50} direction="rtl">
        <Slider.Output className="MySlider-output" />
        <Slider.Track className="MySlider-track">
          <TrackFill className="MySlider-track-fill" />
          <Slider.Thumb className="MySlider-thumb one" />
        </Slider.Track>
      </Slider.Root>

      <Slider.Root
        className="VerticalSlider"
        defaultValue={50}
        direction="rtl"
        orientation="vertical"
      >
        <Slider.Output className="VerticalSlider-output" />
        <Slider.Track className="VerticalSlider-track">
          <TrackFill className="VerticalSlider-track-fill" />
          <Slider.Thumb className="VerticalSlider-thumb one" />
        </Slider.Track>
      </Slider.Root>

      <Slider.Root className="MySlider" defaultValue={[50, 70]} direction="rtl">
        <Slider.Output className="MySlider-output" />
        <Slider.Track className="MySlider-track">
          <TrackFill className="MySlider-track-fill" />
          <Slider.Thumb className="MySlider-thumb one" />
          <Slider.Thumb className="MySlider-thumb two" />
        </Slider.Track>
      </Slider.Root>

      <Slider.Root
        className="VerticalSlider"
        defaultValue={[50, 70]}
        direction="rtl"
        orientation="vertical"
      >
        <Slider.Output className="VerticalSlider-output" />
        <Slider.Track className="VerticalSlider-track">
          <TrackFill className="VerticalSlider-track-fill" />
          <Slider.Thumb className="VerticalSlider-thumb one" />
          <Slider.Thumb className="VerticalSlider-thumb two" />
        </Slider.Track>
      </Slider.Root>
      <Styles />
    </div>
  );
}
