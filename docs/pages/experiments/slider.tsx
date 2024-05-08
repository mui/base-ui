import * as React from 'react';
import { alpha, useTheme } from '@mui/system';
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
        width: `${percent}%`,
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
  const [val1, setVal1] = React.useState(50);
  const [val2, setVal2] = React.useState([40, 60]);
  const [val3, setVal3] = React.useState([20, 40, 60, 80]);
  return (
    <div className="SliderDemo" style={{ width: 320, padding: 16 }}>
      <h3>Uncontrolled</h3>
      <Slider.Root className="MySlider" defaultValue={50}>
        <Slider.Output className="MySlider-output" />
        <Slider.Track className="MySlider-track" render={<span />}>
          <TrackFillSingleThumb className="MySlider-track-fill" />
          <Slider.Thumb className="MySlider-thumb one" />
        </Slider.Track>
      </Slider.Root>

      <Slider.Root className="MySlider" defaultValue={30} disabled render={<span />}>
        <Slider.Output className="MySlider-output" />
        <Slider.Track className="MySlider-track">
          <TrackFillSingleThumb className="MySlider-track-fill" />
          <Slider.Thumb className="MySlider-thumb one" />
        </Slider.Track>
      </Slider.Root>

      <Slider.Root className="MySlider" defaultValue={[40, 60]} render={<span />}>
        <Slider.Output className="MySlider-output" />
        <Slider.Track className="MySlider-track">
          <TrackFillRange className="MySlider-track-fill" />
          <Slider.Thumb className="MySlider-thumb one" />
          <Slider.Thumb className="MySlider-thumb two" />
        </Slider.Track>
      </Slider.Root>

      <Slider.Root className="MySlider" defaultValue={[40, 60, 80]} render={<span />}>
        <Slider.Output className="MySlider-output" />
        <Slider.Track className="MySlider-track">
          <Slider.Thumb className="MySlider-thumb one" />
          <Slider.Thumb className="MySlider-thumb two" />
          <Slider.Thumb className="MySlider-thumb three" />
        </Slider.Track>
      </Slider.Root>

      <h3 style={{ marginTop: 32 }}>Controlled</h3>
      <Slider.Root
        className="MySlider"
        value={val1}
        onValueChange={(newValue) => {
          setVal1(newValue as number);
        }}
      >
        <Slider.Output className="MySlider-output" />
        <Slider.Track className="MySlider-track" render={<span />}>
          <TrackFillSingleThumb className="MySlider-track-fill" />
          <Slider.Thumb className="MySlider-thumb" />
        </Slider.Track>
      </Slider.Root>

      <Slider.Root
        className="MySlider"
        value={val2}
        onValueChange={(newValue) => {
          setVal2(newValue as number[]);
        }}
      >
        <Slider.Output className="MySlider-output" />
        <Slider.Track className="MySlider-track" render={<span />}>
          <TrackFillRange className="MySlider-track-fill" />
          <Slider.Thumb className="MySlider-thumb" />
          <Slider.Thumb className="MySlider-thumb" />
        </Slider.Track>
      </Slider.Root>

      <Slider.Root
        className="MySlider"
        value={val3}
        onValueChange={(newValue) => {
          setVal3(newValue as number[]);
        }}
      >
        <Slider.Output className="MySlider-output" />
        <Slider.Track className="MySlider-track" render={<span />}>
          {val3.map((_val, idx) => (
            <Slider.Thumb key={`thumb-${idx}`} className="MySlider-thumb" />
          ))}
        </Slider.Track>
      </Slider.Root>
      <Styles />
    </div>
  );
}

const cyan = {
  50: '#E9F8FC',
  100: '#BDEBF4',
  200: '#99D8E5',
  300: '#66BACC',
  400: '#1F94AD',
  500: '#0D5463',
  600: '#094855',
  700: '#063C47',
  800: '#043039',
  900: '#022127',
};

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

function useIsDarkMode() {
  const theme = useTheme();
  return theme.palette.mode === 'dark';
}

function Styles() {
  const isDarkMode = useIsDarkMode();
  return (
    <style>{`
    .SliderDemo {
      font-family: system-ui, sans-serif;
    }

    .MySlider {
      width: 100%;
      margin: 16px 0;
      align-items: center;
      position: relative;
      -webkit-tap-highlight-color: transparent;
      display: grid;
      grid-auto-rows: 1.5rem auto;
      grid-gap: 1rem;
    }

    .MySlider-output {
      text-align: right;
      font-size: .875rem;
    }

    .MySlider-track {
      display: flex;
      align-items: center;
      position: relative;
      width: 100%;
      height: 2px;
      border-radius: 9999px;
      background-color: gainsboro;
      touch-action: none;
    }

    .MySlider-track-fill {
      display: block;
      position: absolute;
      height: 100%;
      border-radius: 9999px;
      background-color: black;
    }

    .MySlider-thumb {
      position: absolute;
      width: 16px;
      height: 16px;
      box-sizing: border-box;
      border-radius: 50%;
      background-color: black;
      transform: translateX(-50%);
      touch-action: none;
    }

    .MySlider-thumb:focus-within {
      outline: 2px solid black;
      outline-offset: 2px;
    }

    .MySlider-thumb[data-active] {
      background-color: pink;
    }

    .MySlider-thumb:has(input:disabled) {
      background-color: ${isDarkMode ? grey[600] : grey[300]};
    }

    .MySlider[data-disabled] {
      cursor: not-allowed;
    }
    `}</style>
  );
}
