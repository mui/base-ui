'use client';
import * as React from 'react';
import { useTheme } from '@mui/system';
import { Progress } from '@base_ui/react/Progress';

const VAL1 = 33;

const CUSTOM_BUFFER_VAL = 77;

export default function ProgressDemos() {
  return (
    <div className="ProgressDemos">
      <Progress.Root className="MyProgress" value={50} aria-label="loading progress">
        <Progress.Track className="MyProgress-track">
          <Progress.Indicator className="MyProgress-indicator" />
        </Progress.Track>
      </Progress.Root>

      <Progress.Root className="MyProgress" value={null} aria-labelledby="Label2">
        <span className="Label" id="Label2">
          Indeterminate Progress
        </span>
        <Progress.Track className="MyProgress-track">
          <Progress.Indicator className="MyProgress-indicator" />
        </Progress.Track>
      </Progress.Root>

      <Progress.Root className="MyProgress" value={50} aria-labelledby="Label3" direction="rtl">
        <span className="Label" id="Label3">
          Progress (RTL)
        </span>
        <Progress.Track className="MyProgress-track">
          <Progress.Indicator className="MyProgress-indicator" />
        </Progress.Track>
      </Progress.Root>

      <Progress.Root className="MyProgress" value={null} aria-labelledby="Label4" direction="rtl">
        <span className="Label" id="Label4">
          Indeterminate (RTL)
        </span>
        <Progress.Track className="MyProgress-track">
          <Progress.Indicator className="MyProgress-indicator" />
        </Progress.Track>
      </Progress.Root>

      <h3 id="customizations">Customizations</h3>

      <Progress.Root
        className="MyProgress buffer"
        aria-labelledby="Label5"
        value={VAL1}
        getAriaValueText={(value) => `${value}% complete, ${CUSTOM_BUFFER_VAL}% buffered`}
        max={Math.min(100, CUSTOM_BUFFER_VAL)}
      >
        <span className="Label" id="Label5">
          Custom Buffer Component
        </span>
        <Progress.Track className="MyProgress-track">
          <Progress.Indicator className="MyProgress-indicator" />
          <MyBuffer value={CUSTOM_BUFFER_VAL} className="MyProgress-buffer" />
        </Progress.Track>
      </Progress.Root>

      <Progress.Root
        className="MyProgress buffer"
        aria-labelledby="Label6"
        value={VAL1}
        getAriaValueText={(value) => `${value}% complete, ${CUSTOM_BUFFER_VAL}% buffered`}
        max={Math.min(100, CUSTOM_BUFFER_VAL)}
        direction="rtl"
      >
        <span className="Label" id="Label6">
          Custom Buffer Component (RTL)
        </span>
        <Progress.Track className="MyProgress-track">
          <Progress.Indicator className="MyProgress-indicator" />
          <MyBuffer value={CUSTOM_BUFFER_VAL} className="MyProgress-buffer" />
        </Progress.Track>
      </Progress.Root>
      <Styles />
    </div>
  );
}

function MyBuffer(props: any) {
  const { value, style, ...rest } = props;
  const percentageValue = valueToPercent(value, 0, 100);
  return (
    <span
      style={{
        height: 'inherit',
        position: 'absolute',
        zIndex: 0,
        width: percentageValue ? `${percentageValue}%` : undefined,
        ...style,
      }}
      {...rest}
    />
  );
}

function valueToPercent(value: number | undefined, min: number, max: number) {
  if (value === undefined) {
    return value;
  }

  return ((value - min) * 100) / (max - min);
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

const BLUE400 = '#3399FF';
const BLUE500 = '#007FFF';

function useIsDarkMode() {
  const theme = useTheme();
  return theme.palette.mode === 'dark';
}

export function Styles() {
  const isDarkMode = useIsDarkMode();
  return (
    <style suppressHydrationWarning>{`
      .ProgressDemos {
        font-family: system-ui, sans-serif;
        width: 20rem;
        padding: 1rem;
        display: flex;
        flex-flow: column nowrap;
        gap: 4rem;
      }

      .ProgressDemos h3 {
        color: pink;
      }

      .MyProgress {
        display: flex;
        flex-flow: column nowrap;
        gap: 1rem;
      }

      .MyProgress-track {
        position: relative;
        width: 100%;
        height: 4px;
        border-radius: 9999px;
        background-color: ${grey[400]};
        display: flex;
        overflow: hidden;
      }

      .MyProgress-indicator {
        background-color: ${isDarkMode ? BLUE400 : BLUE500};
        border-radius: inherit;
      }

      .MyProgress-indicator[data-state='indeterminate'] {
        width: 25%;
        animation: indeterminateLoading 1.5s infinite ease-in-out;
        will-change: transform;
      }

      [dir='rtl'] .MyProgress-indicator[data-state='indeterminate'] {
        animation-name: rtlIndeterminateLoading;
      }

      .MyProgress-buffer {
        background-color: ${grey[700]};
        border-radius: inherit;
      }

      .buffer + .MyProgress-indicator {
        position: absolute;
      }

      .Label {
        cursor: unset;
        font-weight: bold;
      }

      .tall .MyProgress-track {
        height: 24px;
        border-radius: 4px;
        background-color: ${grey[200]};
        box-shadow: 0 0 0 1px ${grey[500]};
      }

      .tall .MyProgress-indicator {
        display: flex;
        flex-flow: row nowrap;
        justify-content: center;
        align-items: center;
        border-radius: 3px;
        border-start-end-radius: 0;
        border-end-end-radius: 0;
        background-color: #0059B2;
      }

      .ValueText {
        font-size: 12px;
        line-height: 1;
        color: ${grey[100]};
      }

      .buffer .MyProgress-indicator {
        z-index: 1;
      }

      @keyframes indeterminateLoading {
        from {
          transform: translateX(-100%);
        }

        to {
          transform: translateX(20rem);
        }
      }

      @keyframes rtlIndeterminateLoading {
        from {
          transform: translateX(100%);
        }

        to {
          transform: translateX(-20rem);
        }
      }
    `}</style>
  );
}
