'use client';
import * as React from 'react';
import clsx from 'clsx';
import { Slider } from '@base-ui-components/react/slider';
import { useStableCallback } from '@base-ui-components/utils/useStableCallback';

interface ColorStop {
  id: string;
  value: number; // the slider thumb raw value in the range [0,100]
  hex: string; // hex
}

const INITIAL_START = {
  id: 'initial-start',
  value: 0,
  hex: '#ff0000',
};

const INITIAL_END = {
  id: 'initial-end',
  value: 100,
  hex: '#0000ff',
};

export default function App() {
  const controlRef = React.useRef<HTMLDivElement>(null);
  const trackRef = React.useRef<HTMLDivElement>(null);

  const pressedThumbIdRef = React.useRef<string>(null);

  const [valueUnwrapped, setValueUnwrapped] = React.useState<ColorStop[]>([
    INITIAL_START,
    INITIAL_END,
  ]);

  // raw slider value
  const value = React.useMemo(() => {
    return valueUnwrapped.map((stop) => stop.value);
  }, [valueUnwrapped]);

  const handleChange = useStableCallback((nextValue, eventDetails) => {
    // console.log('nextValue', nextValue);
    function getNewValue(id: ColorStop['id']) {
      return valueUnwrapped.filter((stop) => stop.id !== id);
    }

    let newStop;
    let nextValueUnwrapped;

    if (pressedThumbIdRef.current) {
      const hex = valueUnwrapped.find((v) => v.id === pressedThumbIdRef.current)?.hex;
      if (!hex) {
        return;
      }
      newStop = {
        id: pressedThumbIdRef.current,
        value: nextValue[eventDetails.activeThumbIndex],
        hex,
      };
      nextValueUnwrapped = getNewValue(pressedThumbIdRef.current);

      if (nextValueUnwrapped && newStop) {
        nextValueUnwrapped.push(newStop);
        nextValueUnwrapped.sort((a, b) => a.value - b.value);
        setValueUnwrapped(nextValueUnwrapped);
      }
    } else if (eventDetails.event.key && eventDetails.event.target.parentElement) {
      const activeThumbEl = eventDetails.event.target.parentElement;
      const activeThumbIndex = Number(activeThumbEl.getAttribute('data-index'));
      const activeThumbHex = activeThumbEl.getAttribute('data-value');
      const activeThumbId = activeThumbEl.getAttribute('id');

      const newValue = nextValue[activeThumbIndex];

      // manually prevent swapping via keyboard navigation
      const willOverlap =
        newValue === valueUnwrapped[activeThumbIndex + 1]?.value ||
        newValue === valueUnwrapped[activeThumbIndex - 1]?.value;

      newStop = {
        id: activeThumbId,
        value: newValue,
        hex: activeThumbHex,
      };

      if (willOverlap) {
        nextValueUnwrapped = valueUnwrapped.slice();
        nextValueUnwrapped[activeThumbIndex] = newStop;
        setValueUnwrapped(nextValueUnwrapped);
      } else {
        nextValueUnwrapped = getNewValue(activeThumbId);
        nextValueUnwrapped.push(newStop);
        nextValueUnwrapped.sort((a, b) => a.value - b.value);
        console.log(valueUnwrapped, nextValueUnwrapped);
        setValueUnwrapped(nextValueUnwrapped);
      }
    }
  });

  const cssLinearGradient = React.useMemo(() => {
    const cssStops = valueUnwrapped.map((stop) => `${stop.hex} ${stop.value}%`);
    return `linear-gradient(to right, ${cssStops.join(', ')})`;
  }, [valueUnwrapped]);

  return (
    <div className="pt-16">
      <SliderRoot
        value={value}
        onValueChange={handleChange}
        onValueCommitted={handleChange}
        thumbCollisionBehavior="swap"
        className="w-[320px]"
      >
        <SliderControl
          ref={controlRef}
          onPointerDown={(event) => {
            const controlEl = controlRef.current;
            const trackEl = trackRef.current;

            if (controlEl == null || trackEl == null) {
              return;
            }

            const isMainButton = !event.button || event.button === 0;
            if (!isMainButton) {
              return;
            }

            if (event.target === controlEl || event.target === trackEl) {
              // did not land on a thumb
              event.preventDefault();
              // create a new value/thumb
              const controlRect = controlEl.getBoundingClientRect();
              const nextXCoord = (event.clientX - controlRect.left) / controlRect.width;
              const nextVal = Math.round(nextXCoord * 100);
              const nextIndex = valueUnwrapped.findIndex((v) => v.value > nextVal);
              const nextStops = valueUnwrapped.slice();

              let hex = '#ff8800';
              if (nextStops.length > 0) {
                if (nextIndex === -1) {
                  hex = nextStops[nextStops.length - 1].hex; // same as last
                } else if (nextIndex === 0) {
                  hex = nextStops[0].hex; // same as first
                } else {
                  const prev = nextStops[nextIndex - 1];
                  const next = nextStops[nextIndex];
                  hex = getHexMidpoint(prev.hex, next.hex);
                }
              }

              const newStop: ColorStop = {
                value: nextVal,
                hex,
                id: Math.random().toString(36).slice(2),
              };

              if (nextIndex === -1) {
                nextStops.push(newStop);
              } else {
                nextStops.splice(nextIndex, 0, newStop);
              }
              setValueUnwrapped(nextStops);
            }
          }}
          onPointerUp={() => {
            pressedThumbIdRef.current = null;
          }}
        >
          <SliderTrack ref={trackRef} style={{ background: cssLinearGradient }}>
            {valueUnwrapped.map((val: ColorStop, i) => {
              return (
                <SliderThumb
                  key={val.id}
                  index={i}
                  id={val.id}
                  data-value={val.hex}
                  style={{ backgroundColor: val.hex }}
                  onPointerDown={() => {
                    pressedThumbIdRef.current = val.id;
                  }}
                />
              );
            })}
          </SliderTrack>
        </SliderControl>
      </SliderRoot>
      <ul className="mt-4">
        {valueUnwrapped.map((stop) => {
          return (
            <li key={stop.id} className="flex items-center">
              <input
                type="color"
                defaultValue={stop.hex}
                onChange={(event) => {
                  const nextColor = event.target.value;

                  setValueUnwrapped((prev) => {
                    return prev.map((val) =>
                      val.id === stop.id ? { ...val, hex: nextColor } : val,
                    );
                  });
                }}
              />
              <code className="text-xs">{stop.hex}</code>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function SliderRoot({ className, ...props }: Slider.Root.Props<any>) {
  return <Slider.Root className={clsx('grid grid-cols-2', className)} {...props} />;
}

const SliderControl = React.forwardRef<HTMLDivElement, Slider.Control.Props>(function SliderControl(
  { className, ...props }: Slider.Control.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  return (
    <Slider.Control
      ref={forwardedRef}
      className={clsx('flex col-span-2 touch-none items-center py-3 select-none', className)}
      {...props}
    />
  );
});

const SliderTrack = React.forwardRef<HTMLDivElement, Slider.Track.Props>(function SliderTrack(
  { className, ...props }: Slider.Track.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  return (
    <Slider.Track
      ref={forwardedRef}
      className={clsx(
        'h-1 w-full rounded bg-gray-200 shadow-[inset_0_0_0_1px] shadow-gray-200 select-none',
        className,
      )}
      {...props}
    />
  );
});

function SliderThumb({ className, ...props }: Slider.Thumb.Props) {
  return (
    <Slider.Thumb
      className={clsx(
        'size-4 rounded-full bg-white outline outline-gray-300 select-none has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-blue-800',
        className,
      )}
      {...props}
    />
  );
}

/* eslint-disable no-bitwise */
function getHexMidpoint(hex1: string, hex2: string): string {
  const c1 = parseInt(hex1.slice(1), 16);
  const c2 = parseInt(hex2.slice(1), 16);
  const r = ((c1 >> 16) + (c2 >> 16)) >> 1;
  const g = (((c1 >> 8) & 0xff) + ((c2 >> 8) & 0xff)) >> 1;
  const b = ((c1 & 0xff) + (c2 & 0xff)) >> 1;
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}
