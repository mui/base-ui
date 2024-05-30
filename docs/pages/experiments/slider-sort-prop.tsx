import * as React from 'react';
import * as Slider from '@base_ui/react/Slider';
import { Styles, TrackFill } from './slider';
import { Label, LabelRange } from './slider-label';

export default function App() {
  return (
    <div className="App">
      <pre>default behavior</pre>
      <Slider.Root className="MySlider" defaultValue={[40, 50]} aria-labelledby="LabelId">
        <Label id="LabelId" className="MySlider-label">
          Label
        </Label>
        <Slider.Output className="MySlider-output" />
        <Slider.Track className="MySlider-track">
          <TrackFill className="MySlider-track-fill" />
          <Slider.Thumb className="MySlider-thumb red" />
          <Slider.Thumb className="MySlider-thumb blue" />
        </Slider.Track>
      </Slider.Root>

      <pre>sort=&ldquo;off&rdquo;</pre>
      <Slider.Root
        className="MySlider"
        defaultValue={[40, 50]}
        sort="off"
        aria-labelledby="LabelRangeId"
      >
        <LabelRange id="LabelRangeId" className="MySlider-label">
          Range Label
        </LabelRange>
        <Slider.Output className="MySlider-output" />
        <Slider.Track className="MySlider-track">
          <TrackFill className="MySlider-track-fill" />
          <Slider.Thumb className="MySlider-thumb red" />
          <Slider.Thumb className="MySlider-thumb blue" />
        </Slider.Track>
      </Slider.Root>
      <Styles />
      <Styles2 />
    </div>
  );
}

function Styles2() {
  return (
    <style>
      {`
        .MySlider-thumb:focus-visible {
          z-index: 1;
        }

        .MySlider {
          grid-template-columns: 1fr 1fr;
        }

        .MySlider-label {
          font-size: .875rem;
        }

        .MySlider-track {
          grid-column: span 2;
        }

        .red,
        .red[data-dragging] {
          background-color: red;
        }

        .blue,
        .blue[data-dragging] {
          background-color: blue;
        }

        .green,
        .green[data-dragging] {
          background-color: green;
        }

        pre {
          font-size: .5rem;
          margin-bottom: 2rem;
        }

        pre:not(:first-of-type) {
          margin-top: 8rem;
        }
      `}
    </style>
  );
}
