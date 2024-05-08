import * as React from 'react';
import { alpha } from '@mui/system';
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
  )
}

const grey = {
  50: '#F3F6F9',
  100: '#E5EAF2',
  200: '#DAE2ED',
  300: '#C7D0DD',
  400: '#B0B8C4',
  500: '#9DA8B7',
  600: '#6B7A90',
  700: '#434D5B',
  800: '#303740',
  900: '#1C2025',
};

function Styles() {
  const isDarkMode = false;
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
      color: ${isDarkMode ? grey[300] : grey[800]};
      height: 100%;
      width: 5rem;
      padding: 1rem 0;
      align-items: center;
      position: relative;
      touch-action: none;
      -webkit-tap-highlight-color: transparent;
      display: flex;
      flex-flow: column nowrap;
    }

    .VerticalSlider-output {
      margin-bottom: 1rem;
      font-size: .875rem;
    }

    .VerticalSlider-track {
      display: block;
      position: relative;
      height: 20rem;
      width: .25rem;
      border-radius: .375rem;
      background-color: color-mix(in srgb, currentColor 30%, transparent);
      cursor: pointer;
    }

    .VerticalSlider-track-fill {
      display: block;
      position: absolute;
      width: .25rem;
      border-radius: .375rem;
      background-color: currentColor;
      bottom: 0;
    }

    .VerticalSlider-thumb {
      display: flex;
      align-items: center;
      justify-content: center;
      position: absolute;
      width: 1.5rem;
      height: 1.5rem;
      box-sizing: border-box;
      border-radius: 50%;
      outline: 0;
      left: -.65rem;
      margin-bottom: -.75rem;
      background-color: ${isDarkMode ? grey[300] : grey[800]};
      transition-property: box-shadow, transform;
      transition-timing-function: ease;
      transition-duration: 120ms;
      transform-origin: center;
    }

    .VerticalSlider-thumb:hover {
      box-shadow: 0 0 0 .375rem ${alpha(isDarkMode ? grey[300] : grey[500], 0.3)};
    }

    .VerticalSlider-thumb:focus-within {
      box-shadow: 0 0 0 .5rem ${alpha(isDarkMode ? grey[400] : grey[500], 0.5)};
      outline: none;
    }

    .VerticalSlider-thumb[data-active] {
      box-shadow: 0 0 0 .5rem ${alpha(isDarkMode ? grey[400] : grey[500], 0.5)};
      outline: none;
      transform: scale(1.2);
    }

    .VerticalSlider-thumb:has(input:disabled) {
      background-color: ${isDarkMode ? grey[600] : grey[300]};
    }

    .VerticalSlider[data-disabled] {
      pointer-events: none;
      cursor: default;
      color: ${isDarkMode ? grey[600] : grey[300]};
      outline: none;
    }
    `}</style>
  );
}
