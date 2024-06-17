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
          'relative w-full items-center grid grid-cols-2 gap-4',
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
   * Class names applied to the element or a function that returns them based on the component's state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
};

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

SliderOutput.propTypes = {
  /**
   * Class names applied to the element or a function that returns them based on the component's state.
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

SliderControl.propTypes = {
  /**
   * Class names applied to the element or a function that returns them based on the component's state.
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
          'w-full h-0.5 rounded-full bg-gray-400 touch-none dark:bg-gray-700',
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
   * Class names applied to the element or a function that returns them based on the component's state.
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

SliderThumb.propTypes = {
  /**
   * Class names applied to the element or a function that returns them based on the component's state.
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
   * Class names applied to the element or a function that returns them based on the component's state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
};

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
