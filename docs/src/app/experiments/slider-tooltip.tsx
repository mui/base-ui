'use client';
import * as React from 'react';
import { useTheme } from '@mui/system';
import { Slider } from '@base-ui-components/react/slider';
import { Tooltip } from '@base-ui-components/react/tooltip';
import { useSliderRootContext } from '../../../../packages/react/src/slider/root/SliderRootContext';

function useIsDarkMode() {
  const theme = useTheme();
  return theme.palette.mode === 'dark';
}

// making a Material/Joy style slider with Slider + Tooltip
export default function App() {
  const [valueLabelOpen, setValueLabelOpen] = React.useState(false);

  const handleGlobalPointerUp = () => {
    if (valueLabelOpen) {
      setValueLabelOpen(false);
    }
  };

  return (
    <div className="App">
      <Slider.Root className="JoySlider" defaultValue={40}>
        <Slider.Control className="JoySlider-control">
          <Slider.Track className="JoySlider-track">
            <Slider.Indicator className="JoySlider-indicator" />
            {Array.from(Array(10), (_, x) => x).map((v) => {
              return <SliderMark key={v} index={v} className="JoySlider-mark" />;
            })}
            <Tooltip.Root delay={0} open={valueLabelOpen}>
              <Slider.Thumb
                className="JoySlider-thumb"
                onFocus={() => {
                  if (!valueLabelOpen) {
                    setValueLabelOpen(true);
                  }
                }}
                onBlur={() => {
                  if (valueLabelOpen) {
                    setValueLabelOpen(false);
                  }
                }}
                onPointerOver={() => {
                  if (!valueLabelOpen) {
                    setValueLabelOpen(true);
                  }
                }}
                onPointerLeave={(event) => {
                  if (event.buttons !== 1) {
                    setValueLabelOpen(false);
                  } else {
                    document.addEventListener('pointerup', handleGlobalPointerUp, {
                      once: true,
                    });
                  }
                }}
              >
                <Tooltip.Trigger className="SliderTooltip-trigger" />
              </Slider.Thumb>
              <Tooltip.Positioner sideOffset={10} alignment="center">
                <Tooltip.Popup
                  className="SliderTooltip-popup"
                  data-open={String(valueLabelOpen)}
                >
                  <Slider.Output />
                  <Tooltip.Arrow className="SliderTooltip-arrow" />
                </Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Root>
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>
      <Styles />
    </div>
  );
}

const SliderMark = React.forwardRef(function SliderMark(
  props: any,
  ref: React.ForwardedRef<any>,
) {
  const { index, style, ...otherProps } = props;
  const { percentageValues } = useSliderRootContext();
  const isFilled = percentageValues[0] >= index * 10;
  return (
    <span
      ref={ref}
      data-mark-active={String(isFilled)}
      style={{
        ...style,
        left: `${(100 / 10) * (index + 0)}%`,
        visibility: index === 0 ? 'hidden' : 'inherit',
      }}
      {...otherProps}
    />
  );
});

function Styles() {
  // Replace this with your app logic for determining dark mode
  const isDarkMode = useIsDarkMode();
  return (
    <style suppressHydrationWarning>
      {`
        .App {
          width: 20rem;
          padding: 1rem;
        }

        .JoySlider {
          width: 100%;
          margin: 16px 0;
          position: relative;
          -webkit-tap-highlight-color: transparent;
        }

        .JoySlider-control {
          display: flex;
          align-items: center;
          position: relative;
          width: 100%;
          height: 16px;
          border-radius: 9999px;
          touch-action: none;
          margin-top: 2rem;
          cursor: pointer;
        }

        .JoySlider-track {
          width: 100%;
          height: 6px;
          border-radius: 9999px;
          touch-action: none;
          background-color: ${isDarkMode ? '#dde7ee' : '#32383e'};
        }

        .JoySlider-indicator {
          border-radius: 9999px;
          background-color: #0b6bcb;
        }

        .JoySlider-mark {
          position: absolute;
          height: 6px;
          width: 6px;
          display: flex;
          flex-flow: row nowrap;
          justify-content: center;
          align-items: center;
          transform: translateX(-50%);
        }

        .JoySlider-mark::before {
          content: '';
          display: inline-block;
          width: 2px;
          height: 2px;
          border-radius: 2px;
          background-color: ${isDarkMode ? '#9fa6ad' : '#555e68'};
        }

        .JoySlider-mark[data-mark-active='true']::before {
          background-color: white;
        }

        .JoySlider-thumb {
          width: 18px;
          height: 18px;
          box-sizing: border-box;
          border-radius: 50%;
          background-color: #fefefe;
          touch-action: none;
        }

        .JoySlider-thumb::before {
          position: absolute;
          content: '';
          box-sizing: border-box;
          border: 2px solid #0b6bcb;
          border-radius: inherit;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }

        .JoySlider-thumb[data-dragging],
        .JoySlider-thumb:focus-visible {
          outline-offset: 0;
          outline: 2px solid #0b6bcb;
          outline-width: max(4px, 18px / 3.6);
          outline-color: color-mix(in srgb, #0b6bcb 32%, transparent);
        }

        .SliderTooltip-trigger {
          position: absolute;
          top: 0;
          right: 0;
          bottom: 0;
          left: 0;
          border: 0;
          border-radius: 9999px;
          opacity: 0;
          cursor: pointer;
        }

        .SliderTooltip-popup {
          font-family: system-ui, sans-serif;
          font-size: .875rem;
          line-height: 1.5;
          background-color: #636B74;
          color: white;
          padding-inline: .375rem;
          border-radius: 2px;
          opacity: 0;
        }

        .SliderTooltip-popup[data-open='true'] {
          opacity: 1;
        }

        .SliderTooltip-arrow {
          color: #555e68;
          bottom: 0;
          border: 4px solid;
          border-color: currentColor;
          border-right-color: transparent;
          border-bottom-color: transparent;
          border-left-color: transparent;
          left: 50%;
          transform: translateY(100%);
          background-color: transparent;
        }
      `}
    </style>
  );
}
