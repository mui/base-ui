'use client';
import * as React from 'react';
import { useTheme } from '@mui/system';
import { Slider as BaseSlider } from '@base-ui-components/react/slider';

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
        <Label id="VolumeSliderLabel" htmlFor=":slider-thumb-input:">
          Volume
        </Label>
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
  props: BaseSlider.Root.Props,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  return (
    <BaseSlider.Root
      {...props}
      ref={ref}
      className={(state) =>
        classNames(
          'relative grid w-full grid-cols-2 items-center gap-4 font-sans',
          typeof props.className === 'function'
            ? props.className(state)
            : props.className,
        )
      }
    />
  );
});

const SliderOutput = React.forwardRef(function SliderOutput(
  props: BaseSlider.Value.Props,
  ref: React.ForwardedRef<HTMLOutputElement>,
) {
  return (
    <BaseSlider.Value
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
  props: BaseSlider.Control.Props,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  return (
    <BaseSlider.Control
      {...props}
      ref={ref}
      className={(state) =>
        classNames(
          'relative col-span-2 flex h-4 w-full items-center',
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
  props: BaseSlider.Track.Props,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  return (
    <BaseSlider.Track
      {...props}
      ref={ref}
      className={(state) =>
        classNames(
          'h-0.5 w-full touch-none rounded-full bg-gray-400 dark:bg-gray-700',
          typeof props.className === 'function'
            ? props.className(state)
            : props.className,
        )
      }
    />
  );
});

const SliderThumb = React.forwardRef(function SliderThumb(
  props: BaseSlider.Thumb.Props,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  return (
    <BaseSlider.Thumb
      {...props}
      ref={ref}
      className={(state) =>
        classNames(
          'box-border h-4 w-4 touch-none rounded-[50%] bg-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black dark:bg-gray-100 dark:focus-visible:outline-1 dark:focus-visible:outline-offset-[3px] dark:focus-visible:outline-gray-300',
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
  props: BaseSlider.Indicator.Props,
  ref: React.ForwardedRef<HTMLDivElement>,
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

function Label(props: React.LabelHTMLAttributes<HTMLLabelElement>) {
  const { id, htmlFor, ...otherProps } = props;

  return <label id={id} htmlFor={htmlFor} className="font-bold" {...otherProps} />;
}
