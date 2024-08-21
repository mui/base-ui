import * as React from 'react';
import PropTypes from 'prop-types';
import { useTheme } from '@mui/system';
import * as BaseCheckbox from '@base_ui/react/Checkbox';
import * as CheckboxGroup from '@base_ui/react/CheckboxGroup';
import * as Field from '@base_ui/react/Field';
import Check from '@mui/icons-material/Check';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

function useIsDarkMode() {
  const theme = useTheme();
  return theme.palette.mode === 'dark';
}

function Label(props) {
  return (
    // eslint-disable-next-line jsx-a11y/label-has-associated-control, jsx-a11y/no-noninteractive-element-interactions
    <label
      className="flex gap-2 mb-2"
      onMouseDown={(e) => e.preventDefault()}
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
          <Field.Label className="font-bold text-lg mb-2 flex">Colors</Field.Label>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <Label>
              <Checkbox name="red">
                <Indicator>
                  <Check className="w-full h-full" />
                </Indicator>
              </Checkbox>
              Red
            </Label>
            <Label>
              <Checkbox name="green">
                <Indicator>
                  <Check className="w-full h-full" />
                </Indicator>
              </Checkbox>
              Green
            </Label>
            <Label>
              <Checkbox name="blue">
                <Indicator>
                  <Check className="w-full h-full" />
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
