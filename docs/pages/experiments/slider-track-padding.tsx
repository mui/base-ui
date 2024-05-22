import * as React from 'react';
import * as Slider from '@base_ui/react/Slider';
import { Styles, TrackFill } from './slider';

export default function App() {
  return (
    <div className="App">
      <Slider.Root className="MySlider" defaultValue={50}>
        <Slider.Output className="MySlider-output" />
        <Slider.Track className="MySlider-track">
          <TrackFill className="MySlider-track-fill" />
          <Slider.Thumb className="MySlider-thumb one" />
        </Slider.Track>
      </Slider.Root>

      <Slider.Root className="MySlider" defaultValue={50}>
        <Slider.Output className="MySlider-output" />
        <Slider.Track className="MySlider-track2">
          <span className="MySlider-rail">
            <TrackFill className="MySlider-track-fill" />
          </span>
          <Slider.Thumb className="MySlider-thumb one" />
        </Slider.Track>
      </Slider.Root>
      <Styles />
      <LocalStyles />
    </div>
  );
}

function LocalStyles() {
  return (
    <style suppressHydrationWarning>{`
      .MySlider-track2 {
        display: flex;
        align-items: center;
        position: relative;
        width: 100%;
        height: 16px;
        border-radius: 9999px;
        touch-action: none;
      }

      .MySlider-rail {
        width: 100%;
        height: 2px;
        border-radius: 9999px;
        background-color: gainsboro;
      }
    `}</style>
  );
}
