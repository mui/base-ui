import * as React from 'react';
import * as Slider from '@base_ui/react/Slider2';
import { valueToPercent } from '@base_ui/react/useSlider2/utils';
import { useSliderContext } from '@base_ui/react/Slider2/SliderContext';

function TrackFillSingleThumb(props: any) {
  const { value: values, min, max } = useSliderContext('Track');
  const value = values[0];
  const { style, ...otherProps } = props;
  const percent = valueToPercent(value, min, max);

  return (
    <span
      {...otherProps}
      style={{
        height: `${percent}%`,
        ...style,
      }}
    />
  );
}

function TrackFillRange(props: any) {
  const { axis, axisProps, min, max, value: values } = useSliderContext('Track');
  const { style, ...otherProps } = props;

  const trackOffset = valueToPercent(values[0], min, max);
  const trackLeap = valueToPercent(values[values.length - 1], min, max) - trackOffset;

  return (
    <span
      {...otherProps}
      style={{
        ...axisProps[axis].offset(trackOffset),
        ...axisProps[axis].leap(trackLeap),
        ...style,
      }}
    />
  );
}

export default function App() {
  return (
    <div className="App">
      <Slider.Root className="VerticalSlider" defaultValue={50} orientation="vertical">
        <Slider.Output className="VerticalSlider-output" />
        <Slider.Track className="VerticalSlider-track">
          <TrackFillSingleThumb className="VerticalSlider-track-fill" />
          <Slider.Thumb className="VerticalSlider-thumb" />
        </Slider.Track>
      </Slider.Root>

      <Slider.Root className="VerticalSlider" defaultValue={[40, 60]} orientation="vertical">
        <Slider.Output className="VerticalSlider-output" />
        <Slider.Track className="VerticalSlider-track">
          <TrackFillRange className="VerticalSlider-track-fill" />
          <Slider.Thumb className="VerticalSlider-thumb" />
          <Slider.Thumb className="VerticalSlider-thumb" />
        </Slider.Track>
      </Slider.Root>
      <Styles />
    </div>
  );
}

function Styles() {
  return (
    <style>{`
    .App {
      font-family: system-ui, sans-serif;
      padding: 1rem;
      display: flex;
      flex-flow: row nowrap;
      gap: 4rem;
    }

    .VerticalSlider {
      height: 100%;
      width: 5rem;
      margin: 1rem 0;
      align-items: center;
      position: relative;
      -webkit-tap-highlight-color: transparent;
      display: flex;
      flex-flow: column nowrap;
    }

    .VerticalSlider-output {
      margin-bottom: 1rem;
      font-size: .875rem;
    }

    .VerticalSlider-track {
      display: flex;
      justify-content: center;
      position: relative;
      height: 20rem;
      width: 2px;
      border-radius: 9999px;
      background-color: gainsboro;
      touch-action: none;
      box-sizing: border-box;
    }

    .VerticalSlider-track-fill {
      position: absolute;
      width: 100%;
      border-radius: 9999px;
      background-color: black;
      bottom: 0;
      box-sizing: border-box;
    }

    .VerticalSlider-thumb {
      position: absolute;
      width: 16px;
      height: 16px;
      box-sizing: border-box;
      border-radius: 50%;
      background-color: black;
      touch-action: none;
      transform: translateY(50%);
    }

    .VerticalSlider-thumb:focus-within {
      outline: 2px solid black;
      outline-offset: 2px;
    }

    .VerticalSlider-thumb[data-active] {
      background-color: pink;
    }

    .VerticalSlider[data-disabled] {
      cursor: not-allowed;
    }
    `}</style>
  );
}
