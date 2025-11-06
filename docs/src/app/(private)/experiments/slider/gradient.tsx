'use client';
import * as React from 'react';
import clsx from 'clsx';
import { Slider } from '@base-ui-components/react/slider';
import { useStableCallback } from '@base-ui-components/utils/useStableCallback';

interface ColorStop {
  value: number; // the slider thumb raw value in the range [0,100]
  hex: string; // hex
}

const INITIAL_START = {
  value: 0,
  hex: '#ffffff',
};

const INITIAL_END = {
  value: 100,
  hex: '#999999',
};

export default function App() {
  const controlRef = React.useRef<HTMLDivElement>(null);
  const trackRef = React.useRef<HTMLDivElement>(null);

  const pressedColorRef = React.useRef<string>(null);

  const [valueUnwrapped, setValueUnwrapped] = React.useState<ColorStop[]>([
    INITIAL_START,
    INITIAL_END,
  ]);

  const value = React.useMemo(() => {
    return valueUnwrapped.map((stop) => stop.value);
  }, [valueUnwrapped]);

  const setValue = useStableCallback((nextValue, eventDetails) => {
    // console.log('nextValue', nextValue, eventDetails, pressedColorRef.current);

    function getNewValue(hex: ColorStop['hex']) {
      return valueUnwrapped.filter((stop) => stop.hex !== hex);
    }

    let newStop;
    let newValue;

    if (pressedColorRef.current) {
      newStop = {
        value: nextValue[eventDetails.activeThumbIndex],
        hex: pressedColorRef.current,
      };
      newValue = getNewValue(pressedColorRef.current);
    } else if (eventDetails.event.key && eventDetails.event.target.parentElement) {
      const activeThumbEl = eventDetails.event.target.parentElement;
      const activeThumbIndex = activeThumbEl.getAttribute('data-index');
      const activeThumbHex = activeThumbEl.getAttribute('data-value');
      // console.log('key press setValue() activeThumbHex', activeThumbHex);
      newStop = {
        value: nextValue[activeThumbIndex],
        hex: activeThumbHex,
      };
      newValue = getNewValue(activeThumbHex);
    }

    if (newValue && newStop) {
      newValue.push(newStop);
      newValue.sort((a, b) => a.value - b.value);
      setValueUnwrapped(newValue);
    }
  });

  return (
    <div className="pt-16">
      <SliderRoot
        value={value}
        onValueChange={setValue}
        onValueCommitted={setValue}
        thumbCollisionBehavior="swap"
        className="w-[320px]"
      >
        <SliderControl
          ref={controlRef}
          onPointerDown={(event) => {
            const controlEl = controlRef.current;
            const trackEl = trackRef.current;
            if (controlEl != null && (event.target === controlEl || event.target === trackEl)) {
              // did not land on a thumb
              event.preventDefault();
              // create a new value/thumb
              const controlRect = controlEl.getBoundingClientRect();
              const nextXCoord = (event.clientX - controlRect.left) / controlRect.width;
              const nextVal = Math.round(nextXCoord * 100);
              console.log('nextVal', nextVal);
              // const nextSliderValue = val.slice();
              // nextSliderValue.push(nextVal);
              // nextSliderValue.sort((a, b) => a - b);
              // console.log('nextSliderValue', nextSliderValue);
              // setVal(nextSliderValue);
            }
          }}
          onPointerUp={() => {
            pressedColorRef.current = null;
          }}
        >
          <SliderTrack ref={trackRef}>
            {valueUnwrapped.map((val: ColorStop, i) => {
              return (
                <SliderThumb
                  key={`${val.hex}-${i}`}
                  data-value={val.hex}
                  index={i}
                  style={{ backgroundColor: val.hex }}
                  onPointerDown={() => {
                    pressedColorRef.current = val.hex;
                    // console.log('thumb on pointerdown', pressedColorRef.current);
                  }}
                />
              );
            })}
          </SliderTrack>
        </SliderControl>
      </SliderRoot>
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
