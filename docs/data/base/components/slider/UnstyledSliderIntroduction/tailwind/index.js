import * as React from 'react';
import PropTypes from 'prop-types';
import { useTheme } from '@mui/system';
import * as BaseSlider from '@base_ui/react/Slider';

function classNames(...classes) {
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
        <SliderTrack>
          <SliderThumb />
        </SliderTrack>
      </Slider>

      <Slider defaultValue={30} disabled aria-labelledby="BrightnessSliderLabel">
        <Label id="BrightnessSliderLabel">Brightness</Label>
        <SliderOutput />
        <SliderTrack>
          <SliderThumb />
        </SliderTrack>
      </Slider>
    </div>
  );
}

const Slider = React.forwardRef(function Slider(props, ref) {
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

const SliderOutput = React.forwardRef(function SliderOutput(props, ref) {
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

const SliderTrack = React.forwardRef(function SliderTrack(props, ref) {
  return (
    <BaseSlider.Track
      {...props}
      ref={ref}
      className={(state) =>
        classNames(
          "col-span-2 relative flex items-center w-full h-4 before:content-[''] before:w-full before:h-1 before:rounded-full before:touch-none before:bg-[gainsboro]",
          state.disabled && 'cursor-not-allowed',
          typeof props.className === 'function'
            ? props.className(state)
            : props.className,
        )
      }
    />
  );
});

const SliderThumb = React.forwardRef(function SliderThumb(props, ref) {
  return (
    <BaseSlider.Thumb
      {...props}
      ref={ref}
      className={(state) =>
        classNames(
          'absolute w-4 h-4 box-border rounded-[50%] bg-black touch-none translate-x-[-50%] focus-visible:outline-black focus-visible:outline-offset-2',
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

function Label(props) {
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

Label.propTypes = {
  id: PropTypes.string,
};
