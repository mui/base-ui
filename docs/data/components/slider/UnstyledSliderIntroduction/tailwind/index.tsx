'use client';
import * as React from 'react';
import { useTheme } from '@mui/system';
import * as BaseSlider from '@base_ui/react/Slider';

function classNames(...classes: Array<string | boolean | undefined | null>) {
  return classes.filter(Boolean).join(' ');
}

function useIsDarkMode() {
  const theme = useTheme();
  return theme.palette.mode === 'dark';
}

export default function UnstyledSliderIntroduction() {
  // Replace this with your app logic for determining dark mode
  const isDarkMode = useIsDarkMode();

  return (
    <div
      className={isDarkMode ? 'dark' : ''}
      style={{ display: 'flex', flexDirection: 'column', gap: '4rem', width: 320 }}
    >
      <Slider defaultValue={50} aria-labelledby="VolumeSliderLabel">
        <Label id="VolumeSliderLabel">Volume</Label>
        <SliderOutput />
        <SliderControl>
          <SliderTrack>
            <SliderIndicator />
            <SliderThumb />
          </SliderTrack>
        </SliderControl>
      </Slider>
    </div>
  );
}

const Slider = React.forwardRef(function Slider(
  props: BaseSlider.RootProps,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  return (
    <BaseSlider.Root
      {...props}
      ref={ref}
      className={(state) =>
        classNames(
          'relative w-full items-center grid grid-cols-2 gap-4',
          typeof props.className === 'function'
            ? props.className(state)
            : props.className,
        )
      }
    />
  );
});

const SliderOutput = React.forwardRef(function SliderOutput(
  props: BaseSlider.OutputProps,
  ref: React.ForwardedRef<HTMLOutputElement>,
) {
  return (
    <BaseSlider.Output
      {...props}
      ref={ref}
      className={(state) =>
        classNames(
          'text-right',
          typeof props.className === 'function'
            ? props.className(state)
            : props.className,
        )
      }
    />
  );
});

const SliderControl = React.forwardRef(function SliderControl(
  props: BaseSlider.ControlProps,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  return (
    <BaseSlider.Control
      {...props}
      ref={ref}
      className={(state) =>
        classNames(
          'col-span-2 relative flex items-center w-full h-4',
          state.disabled && 'cursor-not-allowed',
          typeof props.className === 'function'
            ? props.className(state)
            : props.className,
        )
      }
    />
  );
});

const SliderTrack = React.forwardRef(function SliderTrack(
  props: BaseSlider.TrackProps,
  ref: React.ForwardedRef<HTMLSpanElement>,
) {
  return (
    <BaseSlider.Track
      {...props}
      ref={ref}
      className={(state) =>
        classNames(
          'w-full h-0.5 rounded-full bg-gray-400 touch-none dark:bg-gray-700',
          typeof props.className === 'function'
            ? props.className(state)
            : props.className,
        )
      }
    />
  );
});

const SliderThumb = React.forwardRef(function SliderThumb(
  props: BaseSlider.ThumbProps,
  ref: React.ForwardedRef<HTMLSpanElement>,
) {
  return (
    <BaseSlider.Thumb
      {...props}
      ref={ref}
      className={(state) =>
        classNames(
          'w-4 h-4 box-border rounded-[50%] bg-black touch-none focus-visible:outline focus-visible:outline-black focus-visible:outline-2 focus-visible:outline-offset-2 dark:bg-gray-100 dark:focus-visible:outline-gray-300 dark:focus-visible:outline-1 dark:focus-visible:outline-offset-[3px]',
          state.dragging && 'bg-pink-400',
          state.disabled && 'bg-gray-400',
          typeof props.className === 'function'
            ? props.className(state)
            : props.className,
        )
      }
    />
  );
});

const SliderIndicator = React.forwardRef(function SliderIndicator(
  props: BaseSlider.IndicatorProps,
  ref: React.ForwardedRef<HTMLSpanElement>,
) {
  return (
    <BaseSlider.Indicator
      {...props}
      ref={ref}
      className={(state) =>
        classNames(
          'h-0.5 rounded-full bg-black dark:bg-gray-100',
          typeof props.className === 'function'
            ? props.className(state)
            : props.className,
        )
      }
    />
  );
});

function Label(props: React.HTMLAttributes<HTMLLabelElement>) {
  const { id, ...otherProps } = props;
  const { subitems, disabled } = BaseSlider.useSliderContext();

  const htmlFor = Array.from(subitems.values())
    .reduce((acc, item) => {
      return `${acc} ${item.inputId}`;
    }, '')
    .trim();

  return (
    <label
      id={id}
      htmlFor={htmlFor}
      className={classNames('font-bold', disabled && 'text-gray-500')}
      {...otherProps}
    />
  );
}
