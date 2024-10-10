'use client';
import * as React from 'react';
import { Slider } from '@base_ui/react/Slider';
import { Styles } from './slider';

export default function App() {
  return (
    <div className="App">
      <Slider.Root className="MySlider" defaultValue={60}>
        <Slider.Output className="MySlider-output" />
        <Slider.Control className="MySlider-control">
          <Slider.Indicator className="MySlider-indicator" />
          <Slider.Thumb className="MySlider-thumb one" />
        </Slider.Control>
      </Slider.Root>
      <Styles />
    </div>
  );
}
