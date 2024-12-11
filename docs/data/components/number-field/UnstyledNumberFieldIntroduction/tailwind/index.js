'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { NumberField as BaseNumberField } from '@base-ui-components/react/number-field';
import { useTheme } from '@mui/system';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

function useIsDarkMode() {
  const theme = useTheme();
  return theme.palette.mode === 'dark';
}

export default function NumberFieldIntroduction() {
  const id = React.useId();
  // Replace this with your app logic for determining dark mode
  const isDarkMode = useIsDarkMode();

  return (
    <div
      className={isDarkMode ? 'dark' : ''}
      style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}
    >
      <NumberField id={id}>
        <NumberFieldScrubArea>
          <NumberFieldVirtualCursor>
            <svg
              width="26"
              height="14"
              viewBox="0 0 24 14"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              shapeRendering="crispEdges"
            >
              <path
                d="M19.3382 3.00223V5.40757L13.0684 5.40757L13.0683 5.40757L6.59302 5.40964V3V1.81225L5.74356 2.64241L1.65053 6.64241L1.28462 7L1.65053 7.35759L5.74356 11.3576L6.59302 12.1878V11L6.59302 8.61585L13.0684 8.61585H19.3382V11V12.1741L20.1847 11.3605L24.3465 7.36049L24.7217 6.9999L24.3464 6.63941L20.1846 2.64164L19.3382 1.82862V3.00223Z"
                fill="black"
                stroke="white"
              />
            </svg>
          </NumberFieldVirtualCursor>
          <label
            htmlFor={id}
            className="cursor-[unset] text-gray-700 dark:text-gray-300"
          >
            Amount
          </label>
        </NumberFieldScrubArea>
        <NumberFieldGroup>
          <NumberFieldDecrement>&minus;</NumberFieldDecrement>
          <NumberFieldInput placeholder="Enter value" />
          <NumberFieldIncrement>+</NumberFieldIncrement>
        </NumberFieldGroup>
      </NumberField>
    </div>
  );
}

const NumberField = React.forwardRef(function NumberField(props, ref) {
  return <BaseNumberField.Root {...props} ref={ref} />;
});

const NumberFieldGroup = React.forwardRef(function NumberFieldGroup(props, ref) {
  return (
    <BaseNumberField.Group
      {...props}
      ref={ref}
      className={(state) =>
        classNames(
          'mt-1 flex items-center rounded border border-solid border-gray-300 dark:border-gray-700',
          'overflow-hidden',
          'focus-within:border-gray-500 focus-within:ring-2 focus-within:ring-gray-200 dark:focus-within:border-gray-400/80 dark:focus-within:ring-gray-500/50',
          state.disabled && 'cursor-not-allowed opacity-40',
          typeof props.className === 'function'
            ? props.className(state)
            : props.className,
        )
      }
    />
  );
});

NumberFieldGroup.propTypes = {
  /**
   * CSS class applied to the element, or a function that
   * returns a class based on the component’s state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
};

const NumberFieldScrubArea = React.forwardRef(
  function NumberFieldScrubArea(props, ref) {
    return (
      <BaseNumberField.ScrubArea
        {...props}
        ref={ref}
        className={(state) =>
          classNames(
            'cursor-ns-resize font-bold select-none',
            typeof props.className === 'function'
              ? props.className(state)
              : props.className,
          )
        }
      />
    );
  },
);

NumberFieldScrubArea.propTypes = {
  /**
   * CSS class applied to the element, or a function that
   * returns a class based on the component’s state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
};

const NumberFieldVirtualCursor = React.forwardRef(
  function NumberFieldVirtualCursor(props, ref) {
    return (
      <BaseNumberField.ScrubAreaCursor
        {...props}
        ref={ref}
        className={(state) =>
          classNames(
            'drop-shadow',
            typeof props.className === 'function'
              ? props.className(state)
              : props.className,
          )
        }
      />
    );
  },
);

NumberFieldVirtualCursor.propTypes = {
  /**
   * CSS class applied to the element, or a function that
   * returns a class based on the component’s state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
};

const NumberFieldInput = React.forwardRef(function NumberFieldInput(props, ref) {
  return (
    <BaseNumberField.Input
      {...props}
      ref={ref}
      className={(state) =>
        classNames(
          'font-[inherit]',
          'relative z-10 self-stretch px-2 py-1 text-base',
          'border-none bg-white dark:bg-gray-900',
          'border border-gray-200 dark:border-gray-700',
          'text-gray-800 dark:text-gray-300',
          'shadow',
          'max-w-[150px] overflow-hidden',
          'focus:z-10 focus:outline-none',
          'focus:border-gray-600 dark:focus:border-gray-400',
          typeof props.className === 'function'
            ? props.className(state)
            : props.className,
        )
      }
    />
  );
});

NumberFieldInput.propTypes = {
  /**
   * CSS class applied to the element, or a function that
   * returns a class based on the component’s state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
};

const buttonStyles = classNames(
  'font-[math]',
  'relative border-none font-bold',
  'transition-colors duration-100',
  'px-3 flex-1 self-stretch font-inherit',
  'bg-gray-50 dark:bg-gray-800',
  'text-gray-700 dark:text-gray-300',
  'border border-gray-200 dark:border-gray-700 m-0',
  'hover:bg-gray-100',
  'hover:border-gray-100 dark:hover:border-gray-600',
  'hover:text-gray-900 dark:hover:text-gray-200',
  'active:bg-gray-200 dark:active:bg-gray-700',
  'disabled:opacity-40 disabled:cursor-not-allowed',
);

const NumberFieldDecrement = React.forwardRef(
  function NumberFieldDecrement(props, ref) {
    return (
      <BaseNumberField.Decrement
        {...props}
        ref={ref}
        className={(state) =>
          classNames(
            buttonStyles,
            'border-r border-r-gray-200 dark:border-r-gray-700',
            'rounded-r-none',
            typeof props.className === 'function'
              ? props.className(state)
              : props.className,
          )
        }
      />
    );
  },
);

NumberFieldDecrement.propTypes = {
  /**
   * CSS class applied to the element, or a function that
   * returns a class based on the component’s state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
};

const NumberFieldIncrement = React.forwardRef(
  function NumberFieldIncrement(props, ref) {
    return (
      <BaseNumberField.Increment
        {...props}
        ref={ref}
        className={(state) =>
          classNames(
            buttonStyles,
            'rounded-r border-l border-l-gray-200 dark:border-l-gray-700',
            'rounded-l-none',
            typeof props.className === 'function'
              ? props.className(state)
              : props.className,
          )
        }
      />
    );
  },
);

NumberFieldIncrement.propTypes = {
  /**
   * CSS class applied to the element, or a function that
   * returns a class based on the component’s state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
};
