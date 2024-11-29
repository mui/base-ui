'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useTheme } from '@mui/system';
import { Checkbox as BaseCheckbox } from '@base-ui-components/react/checkbox';
import { CheckboxGroup } from '@base-ui-components/react/checkbox-group';
import { Field } from '@base-ui-components/react/field';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

function useIsDarkMode() {
  const theme = useTheme();
  return theme.palette.mode === 'dark';
}

function Label(props) {
  return (
    // eslint-disable-next-line  jsx-a11y/no-noninteractive-element-interactions
    <label
      className="mb-2 flex gap-2"
      onMouseDown={(event) => event.preventDefault()}
      {...props}
    />
  );
}

export default function UnstyledCheckboxIntroduction() {
  // Replace this with your app logic for determining dark mode
  const isDarkMode = useIsDarkMode();

  return (
    <div className={isDarkMode ? 'dark' : ''} style={{ display: 'flex', gap: 12 }}>
      <Field.Root>
        <CheckboxGroup.Root defaultValue={['red']}>
          <Field.Label className="mb-2 flex text-lg font-bold">Colors</Field.Label>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <Label>
              <Checkbox name="red">
                <Indicator>
                  <CheckIcon className="h-full w-full" />
                </Indicator>
              </Checkbox>
              Red
            </Label>
            <Label>
              <Checkbox name="green">
                <Indicator>
                  <CheckIcon className="h-full w-full" />
                </Indicator>
              </Checkbox>
              Green
            </Label>
            <Label>
              <Checkbox name="blue">
                <Indicator>
                  <CheckIcon className="h-full w-full" />
                </Indicator>
              </Checkbox>
              Blue
            </Label>
          </div>
        </CheckboxGroup.Root>
      </Field.Root>
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
          'h-6 w-6 rounded-md p-0',
          'border-2 border-solid border-gray-500',
          'focus-visible:ring-opacity-60 outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2',
          'transition-colors duration-150',
          state.disabled && 'cursor-not-allowed opacity-40',
          state.checked && 'bg-gray-500',
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
          'invisible inline-block h-full text-gray-100 data-[checked]:visible',
          typeof props.className === 'function'
            ? props.className(state)
            : props.className,
        )
      }
    >
      <CheckIcon className="h-full w-full" />
    </BaseCheckbox.Indicator>
  );
});

Indicator.propTypes = {
  /**
   * Class names applied to the element or a function that returns them based on the component's state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
};

function CheckIcon(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      {...props}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"
        fill="currentColor"
      />
    </svg>
  );
}
