import * as React from 'react';
import { useTheme } from '@mui/system';
import * as Slider from '@base_ui/react/Slider';
import { useSliderContext } from '@base_ui/react/Slider';

const axisProps = {
  horizontal: {
    offset: (percent: number) => ({ left: `${percent}%` }),
    leap: (percent: number) => ({ width: `${percent}%` }),
  },
  'horizontal-reverse': {
    offset: (percent: number) => ({ right: `${percent}%` }),
    leap: (percent: number) => ({ width: `${percent}%` }),
  },
  vertical: {
    offset: (percent: number) => ({ bottom: `${percent}%` }),
    leap: (percent: number) => ({ height: `${percent}%` }),
  },
};

export const TrackFill = React.forwardRef(function TrackFill(
  props: any,
  ref: React.ForwardedRef<any>,
) {
  // does not support inverted range fill! (yet)
  const { inverted = false, style, ...otherProps } = props;

  const { axis, direction, disabled, orientation, percentageValues } = useSliderContext();

  const isRange = percentageValues.length > 1;

  const isRtl = direction === 'rtl';

  let internalStyles;

  if (isRange) {
    const trackOffset = percentageValues[0];
    const trackLeap = percentageValues[percentageValues.length - 1] - trackOffset;

    internalStyles = {
      ...axisProps[axis].offset(trackOffset),
      ...axisProps[axis].leap(trackLeap),
    };
  } else if (orientation === 'vertical') {
    internalStyles = {
      [inverted ? 'top' : 'bottom']: 0,
      height: `${inverted ? 100 - percentageValues[0] : percentageValues[0]}%`,
    };
  } else {
    internalStyles = {
      width: `${inverted ? 100 - percentageValues[0] : percentageValues[0]}%`,
      [(isRtl || inverted) && isRtl !== inverted ? 'right' : 'left']: 0,
    };
  }

  return (
    <span
      data-disabled={disabled}
      data-inverted={inverted}
      ref={ref}
      {...otherProps}
      style={{
        ...internalStyles,
        ...style,
      }}
    />
  );
});

export default function App() {
  const [val1, setVal1] = React.useState(50);
  const [val2, setVal2] = React.useState([40, 60]);
  const [val3, setVal3] = React.useState([20, 40, 60, 80]);
  return (
    <div className="App">
      <h3>Uncontrolled</h3>
      <Slider.Root className="MySlider" defaultValue={50}>
        <Slider.Output className="MySlider-output" />
        <Slider.Track className="MySlider-track">
          <TrackFill className="MySlider-track-fill" />
          <Slider.Thumb className="MySlider-thumb one" />
        </Slider.Track>
      </Slider.Root>

      <Slider.Root className="MySlider" defaultValue={30} disabled>
        <Slider.Output className="MySlider-output" />
        <Slider.Track className="MySlider-track">
          <TrackFill className="MySlider-track-fill" />
          <Slider.Thumb className="MySlider-thumb one" />
        </Slider.Track>
      </Slider.Root>

      <Slider.Root className="MySlider" defaultValue={[40, 60]}>
        <Slider.Output className="MySlider-output" />
        <Slider.Track className="MySlider-track">
          <TrackFill className="MySlider-track-fill" />
          <Slider.Thumb className="MySlider-thumb one" />
          <Slider.Thumb className="MySlider-thumb two" />
        </Slider.Track>
      </Slider.Root>

      <Slider.Root className="MySlider" defaultValue={[40, 60, 80]}>
        <Slider.Output className="MySlider-output" />
        <Slider.Track className="MySlider-track">
          <TrackFill className="MySlider-track-fill" />
          <Slider.Thumb className="MySlider-thumb one" />
          <Slider.Thumb className="MySlider-thumb two" />
          <Slider.Thumb className="MySlider-thumb three" />
        </Slider.Track>
      </Slider.Root>

      <h3>Controlled</h3>
      <Slider.Root
        className="MySlider"
        value={val1}
        onValueChange={(newValue) => {
          setVal1(newValue as number);
        }}
      >
        <Slider.Output className="MySlider-output" />
        <Slider.Track className="MySlider-track">
          <TrackFill className="MySlider-track-fill" />
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
        <Slider.Track className="MySlider-track">
          <TrackFill className="MySlider-track-fill" />
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
        <Slider.Track className="MySlider-track">
          {val3.map((_val, idx) => (
            <Slider.Thumb key={`thumb-${idx}`} className="MySlider-thumb" />
          ))}
        </Slider.Track>
      </Slider.Root>
      <Styles />
    </div>
  );
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

function useIsDarkMode() {
  const theme = useTheme();
  return theme.palette.mode === 'dark';
}

export function Styles() {
  const isDarkMode = useIsDarkMode();
  return (
    <style suppressHydrationWarning>{`
    .App {
      font-family: system-ui, sans-serif;
      width: 20rem;
      padding: 1rem;
    }

    .App h3 {
      margin-top: 4rem;
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

      margin-bottom: 2rem;
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
      height: 16px;
      border-radius: 9999px;
      touch-action: none;
    }

    .MySlider-track::before {
      content: '';
      width: 100%;
      height: 2px;
      border-radius: 9999px;
      background-color: gainsboro;
      touch-action: none;
    }

    .MySlider-track-fill {
      display: block;
      position: absolute;
      height: 2px;
      border-radius: 9999px;
      background-color: black;
    }

    .MySlider-thumb {
      width: 16px;
      height: 16px;
      box-sizing: border-box;
      border-radius: 50%;
      background-color: black;
      touch-action: none;
    }

    .MySlider-thumb:focus-visible {
      outline: 2px solid black;
      outline-offset: 2px;
    }

    .MySlider-thumb[data-dragging] {
      background-color: pink;
    }

    .MySlider-thumb[data-disabled] {
      background-color: ${isDarkMode ? grey[600] : grey[300]};
    }

    .MySlider[data-disabled] {
      cursor: not-allowed;
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

      margin-bottom: 2rem;
    }

    .VerticalSlider-output {
      margin-bottom: 1rem;
      font-size: .875rem;
    }

    .VerticalSlider-track {
      display: flex;
      flex-flow: column nowrap;
      align-items: center;
      position: relative;
      width: 16px;
      height: 300px;
      border-radius: 9999px;
      touch-action: none;
    }

    .VerticalSlider-track:before {
      content: '';
      height: 100%;
      width: 2px;
      border-radius: 9999px;
      background-color: gainsboro;
      touch-action: none;
    }

    .VerticalSlider-track-fill {
      position: absolute;
      width: 2px;
      border-radius: 9999px;
      background-color: black;
      box-sizing: border-box;
    }

    .VerticalSlider-thumb {
      width: 16px;
      height: 16px;
      box-sizing: border-box;
      border-radius: 50%;
      background-color: black;
      touch-action: none;
    }

    .VerticalSlider-thumb:focus-visible {
      outline: 2px solid black;
      outline-offset: 2px;
    }

    .VerticalSlider-thumb[data-dragging] {
      background-color: pink;
    }

    .VerticalSlider[data-disabled] {
      cursor: not-allowed;
    }
    `}</style>
  );
}
