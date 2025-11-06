'use client';
import * as React from 'react';
import clsx from 'clsx';
import { Slider } from '@base-ui-components/react/slider';

export default function App() {
  const controlRef = React.useRef<HTMLDivElement>(null);
  const trackRef = React.useRef<HTMLDivElement>(null);

  const [val, setVal] = React.useState([50, 70]);

  const setValue = (nextValue) => {
    console.log(nextValue);
    setVal(nextValue);
  };

  return (
    <div>
      <SliderRoot
        value={val}
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
              const nextSliderValue = val.slice();
              nextSliderValue.push(nextVal);
              nextSliderValue.sort((a, b) => a - b);
              console.log('nextSliderValue', nextSliderValue);
              setVal(nextSliderValue);
            }
          }}
        >
          <SliderTrack ref={trackRef}>
            {val.map((v, i) => {
              return <SliderThumb key={i} index={i} />;
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

function SliderValue({ className, ...props }: Slider.Value.Props) {
  return (
    <Slider.Value className={clsx('text-sm font-medium text-gray-900', className)} {...props} />
  );
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

function SliderIndicator({ className, ...props }: Slider.Indicator.Props) {
  return (
    <Slider.Indicator className={clsx('rounded bg-gray-700 select-none', className)} {...props} />
  );
}

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
