import * as React from 'react';
import { alpha, hexToRgb, decomposeColor, recomposeColor, rgbToHex } from '@mui/system';
import * as Slider from '@base_ui/react/Slider2';
import { percentToValue, roundValueToStep } from '@base_ui/react/Slider2/utils';
import { clamp } from '@base_ui/react/utils/clamp';
import { BaseUIEvent } from '@base_ui/react/utils/BaseUI.types';

type Stop = {
  color: string;
  position: number;
};

const INITIAL_VALUES: Stop[] = [
  { color: '#833ab4', position: 0 },
  { color: '#fd1d1d', position: 50 },
  { color: '#fcb045', position: 100 },
];

function classNames(...classes: Array<string | boolean | undefined | null>) {
  return classes.filter(Boolean).join(' ');
}

export default function App() {
  const trackDefaultPreventedRef = React.useRef(false);
  const trackRef = React.useRef<HTMLDivElement>(null);

  const [values, setValues] = React.useState<Stop[]>(INITIAL_VALUES);
  const [openThumbIndex, setOpenThumbIndex] = React.useState<number>(0);

  const thumbInputRef = React.useRef<HTMLElement[]>([]);
  const activeStopRef = React.useRef<Stop | null>(null);
  const isDraggingRef = React.useRef(false);

  const insertNewValue = (newPosition: number) => {
    // console.log('insertNewValue position:', newPosition)

    const newIndex = [...values.map((val) => val.position), newPosition]
      .sort((a, b) => a - b)
      .indexOf(newPosition);
    // console.log('newIndex:', newIndex)

    const newValue = { color: null, position: newPosition };
    const newValues = [...values, newValue].sort((a, b) => a.position - b.position);

    const floor = newValues[newIndex - 1];
    const ceiling = newValues[newIndex + 1];

    const distance = Math.abs(ceiling.position - floor.position);

    const percentage = (newPosition - floor.position) / distance;

    const { values: floorColor } = decomposeColor(hexToRgb((floor as Stop).color));
    const { values: ceilingColor } = decomposeColor(hexToRgb((ceiling as Stop).color));

    // console.log('floor color', floorColor);
    // console.log('ceiling color', ceilingColor);
    // console.log('percentage', percentage);

    const newColor = recomposeColor({
      type: 'rgb',
      values: [
        floorColor[0] * (1 - percentage) + ceilingColor[0] * percentage,
        floorColor[1] * (1 - percentage) + ceilingColor[1] * percentage,
        floorColor[2] * (1 - percentage) + ceilingColor[2] * percentage,
      ],
    });
    // console.log('newColor', rgbToHex(newColor))

    const finalValues = [
      ...values,
      {
        color: rgbToHex(newColor),
        position: newPosition,
      },
    ].sort((a, b) => a.position - b.position);

    setValues(finalValues);
  };

  const removeValueByIndex = (index: number) => {
    // console.log('remove by index:', index);

    const newValues = values.filter((_v, i) => i !== index);

    setValues(newValues);

    const { current: prevRefs } = thumbInputRef;
    const newRefs = prevRefs.filter((_r, i) => i !== index);

    thumbInputRef.current = newRefs;
  };

  const handleValueChange = (newValue: number | number[], activeThumbIndex: number) => {
    if (!Array.isArray(newValue)) {
      console.error('array only!');
      return;
    }

    const activeStopColor = activeStopRef.current?.color ?? null;
    // FIXME: bug happens if activeStopColor appears twice or more
    const valuesWithoutActiveStop = values.filter((val) => val.color !== activeStopColor);
    // console.log('valuesWithoutActiveStop', JSON.stringify(valuesWithoutActiveStop))
    // console.log('newThumbIndex', activeThumbIndex);

    const newValues = [
      ...valuesWithoutActiveStop,
      {
        ...activeStopRef.current,
        position: newValue[activeThumbIndex],
      },
    ].sort((a, b) => a.position - b.position);

    // console.log('handleValueChange', newValues);
    // @ts-ignore
    setValues(newValues);
  };

  const handlePointerDown = (event: BaseUIEvent<React.PointerEvent>) => {
    if (event.target === trackRef.current) {
      event.preventBaseUIHandler();
      trackDefaultPreventedRef.current = true;
    }
  };

  const handlePointerUp = (event: BaseUIEvent<React.PointerEvent>) => {
    if (trackDefaultPreventedRef.current === true) {
      trackDefaultPreventedRef.current = false;
      // console.log('offsetX/Y', event.nativeEvent.offsetX, event.nativeEvent.offsetY);
      // console.log('clientX/Y', event.nativeEvent.clientX, event.nativeEvent.clientY);
      const { current: track } = trackRef;
      const { width, left } = track!.getBoundingClientRect();

      const percent = (event.nativeEvent.offsetX - left) / width;

      let newValue = percentToValue(percent, 0, 100);
      newValue = roundValueToStep(newValue, 1, 0);
      newValue = clamp(newValue, 0, 100);
      // console.log('onPointerUp insertNewValue:', newValue);
      insertNewValue(newValue);
    }
  };

  const gradient = `linear-gradient(to right ${values.reduce((acc, value) => {
    const { color, position } = value;
    return `${acc}, ${color} ${position}%`;
  }, '')})`.trim();

  return (
    <div className="App">
      <Slider.Root
        className="MySlider"
        value={values.map(({ position }) => position)}
        onValueChange={handleValueChange}
      >
        <Slider.Output className="MySlider-output">
          <pre>background: {gradient}</pre>
        </Slider.Output>
        <Slider.Track
          className="MySlider-track"
          render={<span />}
          ref={trackRef}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          style={{
            background: gradient,
          }}
        >
          {values.map(({ color }, index) => (
            <Slider.Thumb
              key={`slider-thumb-${index}`}
              className={classNames('MySlider-thumb', openThumbIndex === index && 'active')}
              onFocus={(event: BaseUIEvent<React.FocusEvent<HTMLInputElement>>) => {
                const currentIndex = Number(event.target.dataset.index);
                if (Number.isInteger(currentIndex)) {
                  setOpenThumbIndex(currentIndex);
                  if (isDraggingRef.current === false) {
                    activeStopRef.current = values[currentIndex];
                  }
                }
              }}
              onBlur={() => {
                if (isDraggingRef.current === false) {
                  activeStopRef.current = null;
                }
              }}
              onPointerDown={(event) => {
                isDraggingRef.current = true;
                const currentIndex = Number(event.currentTarget.dataset.index);
                // console.log('currentStop', values[currentIndex])
                if (Number.isInteger(currentIndex)) {
                  activeStopRef.current = values[currentIndex];
                }
              }}
              onPointerUp={() => {
                isDraggingRef.current = false;
                activeStopRef.current = null;
              }}
              ref={(node: HTMLElement | null) => {
                if (node) {
                  thumbInputRef.current[index] = node;
                }
              }}
              style={{
                backgroundColor: color,
              }}
            />
          ))}
        </Slider.Track>
      </Slider.Root>

      <div className="Widgets">
        <div className="Color">
          <small>Edit selected color</small>
        </div>

        <div className="Stops">
          <small style={{ marginBottom: 16 }}>Stops</small>
          {values.map(({ color, position }, index) => {
            const setActive = () => setOpenThumbIndex(index);
            return (
              // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
              <div
                key={`input-${index}`}
                className={classNames('Stop', openThumbIndex === index && 'active')}
                onClick={setActive}
              >
                <input
                  type="color"
                  value={color}
                  onChange={(event) => {
                    const newValues = values.map((val, i) => {
                      if (i === index) {
                        return {
                          ...val,
                          color: event.target.value,
                        };
                      }
                      return val;
                    });
                    setValues(newValues);
                  }}
                />
                <input type="text" value={color} readOnly disabled className="Stop-color" />
                <input type="text" value={position} readOnly disabled className="Stop-position" />
                <button
                  type="button"
                  onClick={() => removeValueByIndex(index)}
                  disabled={values.length <= 2}
                  className="Stop-delete"
                >
                  Delete
                </button>
              </div>
            );
          })}
        </div>
      </div>
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

function Styles() {
  const isDarkMode = false;
  return (
    <style>{`
    .App {
      font-family: system-ui, sans-serif;
    }

    .MySlider {
      font-family: inherit;
      color: ${isDarkMode ? grey[300] : grey[900]};
      width: 40rem;
      padding: 16px 0;
      align-items: center;
      position: relative;
      touch-action: none;
      -webkit-tap-highlight-color: transparent;
      margin-bottom: 2rem;
    }

    .MySlider-output {
      display: inline-block;
      text-align: right;
      font-size: .875rem;
      margin-bottom: 1rem;
    }

    .MySlider-track {
      display: block;
      position: relative;
      width: 100%;
      height: 3rem;
      border-radius: 6px;
      border: 2px solid ${grey[900]};
      background-color: color-mix(in srgb, currentColor 30%, transparent);
    }

    .MySlider-track:hover {
      cursor: copy;
    }

    .MySlider-thumb {
      display: flex;
      align-items: center;
      justify-content: center;
      position: absolute;
      top: -8px;
      width: 1.25rem;
      height: 4rem;
      margin-left: -6px;
      box-sizing: border-box;
      border-radius: 9999px;
      outline: 0;
      background-color: ${isDarkMode ? grey[300] : grey[500]};
      transition-property: box-shadow, transform;
      transition-timing-function: ease;
      transition-duration: 120ms;
      transform-origin: center;
      border: 2px solid ${grey[600]};
      box-shadow: 0 0 0 2px white inset;
    }

    .MySlider-thumb.active {
      border-color: ${grey[900]};
    }

    .MySlider-thumb:hover {
      box-shadow: 0 0 0 2px white inset, 0 0 0 6px ${alpha(isDarkMode ? grey[300] : grey[200], 0.7)};
      cursor: move;
    }

    .MySlider-thumb:focus-within {
      box-shadow: 0 0 0 8px ${alpha(isDarkMode ? grey[400] : grey[200], 0.5)};
      outline: none;
    }

    .MySlider-thumb[data-active] {
      box-shadow: 0 0 0 8px ${alpha(isDarkMode ? grey[400] : grey[200], 0.5)};
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

    .Widgets {
      display: inline-grid;
      grid-auto-columns: minmax(0, 1fr);
      grid-auto-flow: column;
    }

    .Color {
      display: none;
    }

    .Stops {
      display: flex;
      flex-flow: column nowrap;
    }

    input[type=color] {
      min-width: 2rem;
      cursor: pointer;
    }

    .Stop {
      display: flex;
      gap: 1rem;
      padding: .75rem;
    }

    .Stop.active {
      background-color: ${grey[200]}
    }

    .Stop input[type=text] {
      width: 4.5rem;
    }

    .Stop input[type=text][readonly] {
      color: ${grey[600]}
    }

    .Stop-delete {
      cursor: pointer;
    }
    `}</style>
  );
}
