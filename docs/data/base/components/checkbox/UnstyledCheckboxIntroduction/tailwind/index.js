import * as React from 'react';
import PropTypes from 'prop-types';
import * as BaseCheckbox from '@base_ui/react/Checkbox';
import { useTheme } from '@mui/system';
import Check from '@mui/icons-material/Check';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

function useIsDarkMode() {
  const theme = useTheme();
  return theme.palette.mode === 'dark';
}

export default function UnstyledCheckboxIntroduction() {
  // Replace this with your app logic for determining dark mode
  const isDarkMode = useIsDarkMode();

  return (
    <div className={isDarkMode ? 'dark' : ''} style={{ display: 'flex', gap: 12 }}>
      <Checkbox aria-label="Basic checkbox, on by default" defaultChecked>
        <Indicator />
      </Checkbox>
      <Checkbox aria-label="Basic checkbox, off by default">
        <Indicator />
      </Checkbox>
      <Checkbox
        aria-label="Disabled checkbox, on by default"
        defaultChecked
        disabled
      >
        <Indicator />
      </Checkbox>
      <Checkbox aria-label="Disabled checkbox, off by default" disabled>
        <Indicator />
      </Checkbox>
    </div>
  );
}

const Checkbox = React.forwardRef(function Checkbox(props, ref) {
  return (
    <BaseCheckbox.Root
      {...props}
      ref={ref}
      className={(state) =>
        classNames(
          'w-6 h-6 p-0 rounded-md',
          'border-2 border-solid border-purple-500',
          'outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-purple-500 focus-visible:ring-opacity-60',
          'transition-colors duration-150',
          state.disabled && 'opacity-40 cursor-not-allowed',
          state.checked && 'bg-purple-500',
          !state.checked && 'bg-transparent',
          typeof props.className === 'function'
            ? props.className(state)
            : props.className,
        )
      }
    />
  );
});

Checkbox.propTypes = {
  /**
   * Class names applied to the element or a function that returns them based on the component's state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
};

const Indicator = React.forwardRef(function Indicator(props, ref) {
  return (
    <BaseCheckbox.Indicator
      {...props}
      ref={ref}
      className={(state) =>
        classNames(
          'h-full inline-block invisible data-[state=checked]:visible text-gray-100',
          typeof props.className === 'function'
            ? props.className(state)
            : props.className,
        )
      }
    >
      <Check className="w-full h-full" />
    </BaseCheckbox.Indicator>
  );
});

Indicator.propTypes = {
  /**
   * Class names applied to the element or a function that returns them based on the component's state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
};
