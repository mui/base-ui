'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useTheme } from '@mui/system';
import { Slider as BaseSlider } from '@base-ui-components/react/slider';

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

const Slider = React.forwardRef(function Slider(props, ref) {
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

Slider.propTypes = {
  /**
   * CSS class applied to the element, or a function that
   * returns a class based on the component’s state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
};

const SliderOutput = React.forwardRef(function SliderOutput(props, ref) {
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

SliderOutput.propTypes = {
  /**
   * CSS class applied to the element, or a function that
   * returns a class based on the component’s state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
};

const SliderControl = React.forwardRef(function SliderControl(props, ref) {
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

SliderControl.propTypes = {
  /**
   * CSS class applied to the element, or a function that
   * returns a class based on the component’s state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
};

const SliderTrack = React.forwardRef(function SliderTrack(props, ref) {
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

SliderTrack.propTypes = {
  /**
   * CSS class applied to the element, or a function that
   * returns a class based on the component’s state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
};

const SliderThumb = React.forwardRef(function SliderThumb(props, ref) {
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

SliderThumb.propTypes = {
  /**
   * CSS class applied to the element, or a function that
   * returns a class based on the component’s state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
};

const SliderIndicator = React.forwardRef(function SliderIndicator(props, ref) {
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

SliderIndicator.propTypes = {
  /**
   * CSS class applied to the element, or a function that
   * returns a class based on the component’s state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
};

function Label(props) {
  const { id, htmlFor, ...otherProps } = props;

  return <label id={id} htmlFor={htmlFor} className="font-bold" {...otherProps} />;
}

Label.propTypes = {
  htmlFor: PropTypes.string,
  id: PropTypes.string,
};
