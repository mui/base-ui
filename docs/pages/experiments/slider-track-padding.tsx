import * as React from 'react';
import * as Slider from '@base_ui/react/Slider';
import { Styles } from './slider';

export default function App() {
  return (
    <div className="App">
      <Slider.Root className="MySlider" defaultValue={50}>
        <Slider.Output className="MySlider-output" />
        <Slider.Track className="MySlider-track">
          <Slider.Indicator className="MySlider-indicator" />
          <Slider.Thumb className="MySlider-thumb one" />
        </Slider.Track>
      </Slider.Root>

      <Slider.Root className="MySlider" defaultValue={50}>
        <Slider.Output className="MySlider-output" />
        <Slider.Track className="MySlider-track">
          <span className="Rail">
            <Slider.Indicator className="MySlider-indicator" />
          </span>
          <Slider.Thumb className="MySlider-thumb one" />
        </Slider.Track>
      </Slider.Root>
      <Styles />
    </div>
  );
}
