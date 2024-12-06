'use client';
import * as React from 'react';
import { DirectionProvider } from '@base-ui-components/react/direction-provider';
import { Slider } from '@base-ui-components/react/slider';
import { useSliderRootContext } from '../../../../packages/react/src/slider/root/SliderRootContext';

const STOPS = [
  {
    value: 0,
    label: '0°C',
  },
  {
    value: 25,
    label: '25°C',
  },
  {
    value: 50,
    label: '50°C',
  },
  {
    value: 75,
    label: '75°C',
  },
  {
    value: 100,
    label: '100°C',
  },
];

function getSliderThumbAriaValueText(_formattedValue: string, value: number) {
  return `${value}°C`;
}

// for "inverted track", the track/rail can be styled with CSS but a prop is needed to flip the "mark active" state
function MarkWithLabel(props: {
  index: number;
  value: number;
  label: string;
  inverted?: boolean;
}) {
  const { index, value, label, inverted = false } = props;
  const { direction, values } = useSliderRootContext();
  const isRtl = direction === 'rtl';
  const isFilled = inverted ? value >= values[0] : values[0] >= value;
  return (
    <React.Fragment>
      <span
        className="TempSlider-mark"
        data-filled={isFilled}
        data-index={index}
        data-inverted={inverted}
        dir={isRtl ? 'rtl' : 'ltr'}
        style={{
          // use percentageValues to determine this offset
          // instead of values if min-max isn't 0-100
          [isRtl ? 'right' : 'left']: `${value}%`,
        }}
      />
      <span
        aria-hidden="true"
        className="TempSlider-markLabel"
        data-filled={isFilled}
        data-index={index}
        data-inverted={inverted}
        dir={isRtl ? 'rtl' : 'ltr'}
        style={{
          // use percentageValues to determine this offset
          // instead of values if min-max isn't 0-100
          [isRtl ? 'right' : 'left']: `${value}%`,
        }}
      >
        {label}
      </span>
    </React.Fragment>
  );
}

export default function App() {
  return (
    <div className="App">
      <Slider.Root className="TempSlider" defaultValue={40}>
        <pre>LTR</pre>
        <Slider.Output className="TempSlider-output" />
        <Slider.Control className="TempSlider-control">
          <Slider.Track className="TempSlider-track">
            {STOPS.map((mark, index) => (
              <MarkWithLabel
                key={`mark-${index}`}
                index={index}
                label={mark.label}
                value={mark.value}
              />
            ))}
            <Slider.Indicator className="TempSlider-indicator" />
            <Slider.Thumb
              className="TempSlider-thumb"
              getAriaValueText={getSliderThumbAriaValueText}
            />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>

      <DirectionProvider direction="rtl">
        <Slider.Root className="TempSlider" defaultValue={40}>
          <pre>RTL</pre>
          <Slider.Output className="TempSlider-output" />
          <Slider.Control className="TempSlider-control">
            <Slider.Track className="TempSlider-track">
              {STOPS.map((mark, index) => (
                <MarkWithLabel
                  key={`mark-${index}`}
                  index={index}
                  label={mark.label}
                  value={mark.value}
                />
              ))}
              <Slider.Indicator className="TempSlider-indicator" />
              <Slider.Thumb
                className="TempSlider-thumb"
                getAriaValueText={getSliderThumbAriaValueText}
              />
            </Slider.Track>
          </Slider.Control>
        </Slider.Root>
      </DirectionProvider>
      <BrandingStyles />
    </div>
  );
}

function BrandingStyles() {
  return (
    <style suppressHydrationWarning>{`
    .App {
      --color-primary: hsl(210, 100%, 45%);
      --color-primary-light: hsl(210, 100%, 70%);
      --border-radius: 8px;
      --Slider-thumb-focus: rgba(0, 127, 255, 0.2);
      --_margin: 4px;
      font-family: IBM Plex Sans, system-ui, sans-serif;
      width: 20rem;
      margin: 4rem;
      display: flex;
      flex-flow: column nowrap;
      gap: 6rem;
    }

    .TempSlider {
      color: var(--color-primary);
      width: 100%;
      max-width: calc(100% - var(--_margin));
      margin: 0 var(--_margin);
      display: inline-block;
      position: relative;
      touch-action: none;
      -webkit-tap-highlight-color: transparent;
    }

    .TempSlider:hover {
      opacity: 1;
    }

    .TempSlider-label {
      margin-left: -0.25rem;
    }

    .TempSlider-control {
      display: flex;
      align-items: center;
      position: relative;
      width: 100%;
      height: 32px;
      border-radius: 9999px;
      touch-action: none;
      cursor: pointer;
    }

    .TempSlider-track {
      touch-action: none;
      width: 100%;
      height: 4px;
      border-radius: var(--border-radius);
      background-color: var(--color-primary-light);
    }

    .TempSlider-indicator {
      display: block;
      position: absolute;
      height: 4px;
      border-radius: var(--border-radius);
      background-color: currentColor;
    }

    .TempSlider-thumb {
      width: 16px;
      height: 16px;
      box-sizing: border-box;
      border-radius: var(--border-radius);
      outline: 0;
      background-color: var(--color-primary);
      transition-property: box-shadow, transform;
      transition-timing-function: ease;
      transition-duration: 120ms;
      transform-origin: center;
    }

    .TempSlider-thumb:hover,
    .TempSlider-thumb:focus-visible {
      box-shadow: 0 0 0 6px var(--Slider-thumb-focus);
    }

    .TempSlider-thumb[data-dragging] {
      box-shadow: 0 0 0 8px var(--Slider-thumb-focus);
      outline: none;
      transform: scale(1.2);
    }

    .TempSlider-output {
      font-weight: 600;
      font-size: 16px;
    }

    .TempSlider-mark {
      position: absolute;
      width: 8px;
      height: 8px;
      border-radius: var(--border-radius);
      background-color: var(--color-primary-light);
      top: 50%;
      transform: translate(-50%, -50%);
      &[data-filled='true'] {
        background-color: var(--color-primary);
      }
      &[dir='rtl'] {
        transform: translate(50%, -50%);
      }
    }

    .TempSlider-markLabel {
      font-weight: 500;
      font-size: 12px;
      position: absolute;
      top: 24px;
      margin-top: 8px;
      &[dir='ltr'] {
        transform: translateX(-50%);
        &[data-index='0'] {
          transform: translateX(calc(var(--_margin) * -1));
        }
        &[data-index='4'] {
          transform: translateX(calc(var(--_margin) - 100%));
        }
      }
      &[dir='rtl'] {
        transform: translateX(50%);
        &[data-index='0'] {
          transform: translateX(calc(var(--_margin)));
        }
        &[data-index='4'] {
          transform: translateX(calc(100% - var(--_margin)));
        }
      }
    }
  `}</style>
  );
}
