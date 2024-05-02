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
  return (
    <div style={{ width: 320 }}>
      <h3>Controlled</h3>
      <pre>{val1}</pre>
      <Slider.Root
        className="MySlider"
        value={val1}
        onValueChange={(newValue) => {
          setVal1(newValue as number);
        }}
      >
        <Slider.Track className="MySlider-track" render={<span />}>
          <TrackFillSingleThumb className="MySlider-track-fill" />
          <Slider.Thumb className="MySlider-thumb one" />
        </Slider.Track>
      </Slider.Root>

      <pre>{val2.join('-')}</pre>
      <Slider.Root
        className="MySlider"
        value={val2}
        onValueChange={(newValue) => {
          setVal2(newValue as number[]);
        }}
      >
        <Slider.Track className="MySlider-track" render={<span />}>
          <TrackFillRange className="MySlider-track-fill" />
          <Slider.Thumb className="MySlider-thumb one" />
          <Slider.Thumb className="MySlider-thumb one" />
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
    .MySlider {
      color: ${isDarkMode ? cyan[300] : cyan[500]};
      height: 4px;
      width: 100%;
      padding: 16px 0;
      display: inline-flex;
      align-items: center;
      position: relative;
      cursor: pointer;
      touch-action: none;
      -webkit-tap-highlight-color: transparent;
      margin-bottom: 32px;
    }

    .MySlider-track {
      display: block;
      position: absolute;
      width: 100%;
      height: 4px;
      border-radius: 6px;
      background-color: color-mix(in srgb, currentColor 30%, transparent);
    }

    .MySlider-track-fill {
      display: block;
      position: absolute;
      height: 4px;
      border-radius: 6px;
      background-color: currentColor;
    }

    .MySlider-thumb {
      display: flex;
      align-items: center;
      justify-content: center;
      position: absolute;
      top: -8px;
      width: 20px;
      height: 20px;
      margin-left: -6px;
      box-sizing: border-box;
      border-radius: 50%;
      outline: 0;
      background-color: ${isDarkMode ? cyan[300] : cyan[500]};
      transition-property: box-shadow, transform;
      transition-timing-function: ease;
      transition-duration: 120ms;
      transform-origin: center;
    }

    .MySlider-thumb:hover {
      box-shadow: 0 0 0 6px ${alpha(isDarkMode ? cyan[300] : cyan[200], 0.3)};
    }

    .MySlider-thumb:focus-within {
      box-shadow: 0 0 0 8px ${alpha(isDarkMode ? cyan[400] : cyan[200], 0.5)};
      outline: none;
    }

    .MySlider-thumb[data-active] {
      box-shadow: 0 0 0 8px ${alpha(isDarkMode ? cyan[400] : cyan[200], 0.5)};
      outline: none;
      transform: scale(1.2);
    }

    .MySlider-thumb:has(input:disabled) {
      background-color: ${isDarkMode ? grey[600] : grey[300]};
    }

    .MySlider[data-disabled] {
      pointer-events: none;
      cursor: default;
      color: ${isDarkMode ? grey[600] : grey[300]};
      outline: none;
    }

    .hr {
      margin: 32px 0;
    }
    `}</style>
  );
}
