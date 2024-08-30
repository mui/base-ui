'use client';

import * as React from 'react';
import { useTheme } from '@mui/system';
import * as Slider from '@base_ui/react/Slider';
import { useSliderContext } from '@base_ui/react/Slider';

export default function App() {
  const [val1, setVal1] = React.useState(50);
  const [val2, setVal2] = React.useState([40, 60]);
  const [val3, setVal3] = React.useState([20, 40, 60, 80]);
  return (
    <div className="App">
      <h3 id="uncontrolled">Uncontrolled</h3>
      <Slider.Root className="MySlider" defaultValue={50}>
        <Slider.Output className="MySlider-output" />
        <Slider.Control className="MySlider-control">
          <Slider.Track className="MySlider-track">
            <Slider.Indicator className="MySlider-indicator" />
            <Slider.Thumb className="MySlider-thumb one" />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>

      <Slider.Root className="MySlider" defaultValue={30} disabled>
        <Slider.Output className="MySlider-output" />
        <Slider.Control className="MySlider-control">
          <Slider.Track className="MySlider-track">
            <Slider.Indicator className="MySlider-indicator" />
            <Slider.Thumb className="MySlider-thumb one" />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>

      <Slider.Root className="MySlider" defaultValue={[40, 60]}>
        <Slider.Output className="MySlider-output" />
        <Slider.Control className="MySlider-control">
          <Slider.Track className="MySlider-track">
            <Slider.Indicator className="MySlider-indicator" />
            <Slider.Thumb className="MySlider-thumb one" />
            <Slider.Thumb className="MySlider-thumb two" />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>

      <Slider.Root className="MySlider" defaultValue={[40, 60, 80]}>
        <Slider.Output className="MySlider-output" />
        <Slider.Control className="MySlider-control">
          <Slider.Track className="MySlider-track">
            <Slider.Indicator className="MySlider-indicator" />
            <Slider.Thumb className="MySlider-thumb" />
            <Slider.Thumb className="MySlider-thumb" />
            <Slider.Thumb className="MySlider-thumb" />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>

      <h3 style={{ marginTop: 64 }} id="controlled">
        Controlled
      </h3>
      <Slider.Root
        className="MySlider"
        value={val1}
        onValueChange={(newValue) => {
          setVal1(newValue as number);
        }}
      >
        <Slider.Output className="MySlider-output" />
        <Slider.Control className="MySlider-control">
          <Slider.Track className="MySlider-track">
            <Slider.Indicator className="MySlider-indicator" />
            <Slider.Thumb className="MySlider-thumb" />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>

      <Slider.Root
        className="MySlider"
        value={val2}
        onValueChange={(newValue) => {
          setVal2(newValue as number[]);
        }}
      >
        <Slider.Output className="MySlider-output" />
        <Slider.Control className="MySlider-control">
          <Slider.Track className="MySlider-track">
            <Slider.Indicator className="MySlider-indicator" />
            <Slider.Thumb className="MySlider-thumb" />
            <Slider.Thumb className="MySlider-thumb" />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>

      <Slider.Root
        className="MySlider"
        value={val3}
        onValueChange={(newValue) => {
          setVal3(newValue as number[]);
        }}
      >
        <Slider.Output className="MySlider-output" />
        <Slider.Control className="MySlider-control">
          <Slider.Track className="MySlider-track">
            {val3.map((_val, idx) => (
              <Slider.Thumb key={`thumb-${idx}`} className="MySlider-thumb" />
            ))}
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>

      <h3 style={{ marginTop: 64 }} id="with-labels">
        With custom labels
      </h3>
      <Slider.Root className="MySlider" defaultValue={50} aria-labelledby="LabelId">
        <Label id="LabelId" className="Label">
          Brightness
        </Label>
        <Slider.Output className="MySlider-output" />
        <Slider.Control className="MySlider-control">
          <Slider.Track className="MySlider-track">
            <Slider.Indicator className="MySlider-indicator" />
            <Slider.Thumb className="MySlider-thumb one" />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>

      <Slider.Root className="MySlider" defaultValue={[50, 70]} aria-labelledby="LabelRangeId">
        <LabelRange id="LabelRangeId" className="Label">
          Volume Range
        </LabelRange>
        <Slider.Output className="MySlider-output" />
        <Slider.Control className="MySlider-control">
          <Slider.Track className="MySlider-track">
            <Slider.Indicator className="MySlider-indicator" />
            <Slider.Thumb className="MySlider-thumb one" />
            <Slider.Thumb className="MySlider-thumb two" />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>

      <h3 style={{ marginTop: 64 }} id="vertical">
        Vertical
      </h3>
      <Slider.Root className="VerticalSlider" defaultValue={50} orientation="vertical">
        <Slider.Output className="VerticalSlider-output" />
        <Slider.Control className="VerticalSlider-control">
          <Slider.Track className="VerticalSlider-track">
            <Slider.Indicator className="VerticalSlider-indicator" />
            <Slider.Thumb className="VerticalSlider-thumb" />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>

      <Slider.Root className="VerticalSlider" defaultValue={[40, 60]} orientation="vertical">
        <Slider.Output className="VerticalSlider-output" />
        <Slider.Control className="VerticalSlider-control">
          <Slider.Track className="VerticalSlider-track">
            <Slider.Indicator className="VerticalSlider-indicator" />
            <Slider.Thumb className="VerticalSlider-thumb" />
            <Slider.Thumb className="VerticalSlider-thumb" />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>

      <h3 style={{ marginTop: 64 }} id="rtl">
        RTL
      </h3>
      <Slider.Root className="MySlider" defaultValue={50} direction="rtl">
        <Slider.Output className="MySlider-output" />
        <Slider.Control className="MySlider-control">
          <Slider.Track className="MySlider-track">
            <Slider.Indicator className="MySlider-indicator" />
            <Slider.Thumb className="MySlider-thumb one" />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>

      <Slider.Root
        className="VerticalSlider"
        defaultValue={50}
        direction="rtl"
        orientation="vertical"
        aria-labelledby="RtlLabelId"
      >
        <Slider.Output className="VerticalSlider-output" />
        <Slider.Control className="VerticalSlider-control">
          <Slider.Track className="VerticalSlider-track">
            <Slider.Indicator className="VerticalSlider-indicator" />
            <Slider.Thumb className="VerticalSlider-thumb one" />
          </Slider.Track>
        </Slider.Control>
        <Label id="RtlLabelId" className="Label">
          Brightness
        </Label>
      </Slider.Root>

      <Slider.Root className="MySlider" defaultValue={[50, 70]} direction="rtl">
        <Slider.Output className="MySlider-output" />
        <Slider.Control className="MySlider-control">
          <Slider.Track className="MySlider-track">
            <Slider.Indicator className="MySlider-indicator" />
            <Slider.Thumb className="MySlider-thumb one" />
            <Slider.Thumb className="MySlider-thumb two" />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>

      <Slider.Root
        className="VerticalSlider"
        defaultValue={[50, 70]}
        direction="rtl"
        orientation="vertical"
        aria-labelledby="RtlLabelRangeId"
      >
        <Slider.Output className="VerticalSlider-output" />
        <Slider.Control className="VerticalSlider-control">
          <Slider.Track className="VerticalSlider-track">
            <Slider.Indicator className="VerticalSlider-indicator" />
            <Slider.Thumb className="VerticalSlider-thumb one" />
            <Slider.Thumb className="VerticalSlider-thumb two" />
          </Slider.Track>
        </Slider.Control>
        <LabelRange id="RtlLabelRangeId" className="Label">
          Price Range
        </LabelRange>
      </Slider.Root>
      <Styles />
    </div>
  );
}

function Label(props: any) {
  const { id: idProp, ...otherProps } = props;
  const defaultId = React.useId();
  const labelId = idProp ?? defaultId;

  const { subitems } = useSliderContext();

  const htmlFor = Array.from(subitems.values())
    .reduce((acc, item) => {
      return `${acc} ${item.inputId}`;
    }, '')
    .trim();

  return <label id={labelId} htmlFor={htmlFor} {...otherProps} />;
}

function LabelRange(props: any) {
  const { id: idProp, ...otherProps } = props;

  const defaultId = React.useId();
  const labelId = idProp ?? defaultId;

  return <span id={labelId} {...otherProps} />;
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
      display: flex;
      flex-flow: column nowrap;
    }

    .App h3 {
      color: blue;
    }

    .MySlider {
      width: 100%;
      margin: 2rem 0;
      align-items: center;
      position: relative;
      -webkit-tap-highlight-color: transparent;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .MySlider-output {
      grid-column: 2/3;
      text-align: right;
    }

    [dir='rtl'] .MySlider-output {
      text-align: left;
    }

    .MySlider-control {
      grid-column: 1/3;
      display: flex;
      align-items: center;
      position: relative;
      width: 100%;
      height: 16px;
      border-radius: 9999px;
      touch-action: none;
    }

    .MySlider-track {
      width: 100%;
      height: 2px;
      border-radius: 9999px;
      background-color: gainsboro;
      touch-action: none;
    }

    .MySlider-indicator {
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
      width: 6rem;
      margin: 4rem 0;
      align-items: center;
      position: relative;
      -webkit-tap-highlight-color: transparent;
      display: flex;
      flex-flow: column nowrap;
      gap: 1rem;
    }

    .VerticalSlider-output {
      margin-bottom: 1rem;
    }

    .VerticalSlider-control {
      display: flex;
      flex-flow: column nowrap;
      align-items: center;
      position: relative;
      width: 16px;
      height: 300px;
      border-radius: 9999px;
      touch-action: none;
    }

    .VerticalSlider-track {
      height: 100%;
      width: 2px;
      border-radius: 9999px;
      background-color: gainsboro;
      touch-action: none;
    }

    .VerticalSlider-indicator {
      width: 2px;
      border-radius: 9999px;
      background-color: black;
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

    .VerticalSlider[data-disabled='true'] {
      cursor: not-allowed;
    }

    .Label {
      cursor: unset;
      font-weight: bold;
    }

    .Label[data-orientation='vertical'] {
      text-align: center;
    }

    .Label[data-disabled='true'] {
      color: ${grey[600]};
    }
    `}</style>
  );
}
