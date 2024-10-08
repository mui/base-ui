'use client';
import * as React from 'react';
import { useTheme } from '@mui/system';
import { Checkbox as BaseCheckbox } from '@base_ui/react/Checkbox';
import { CheckboxGroup } from '@base_ui/react/CheckboxGroup';
import { Field } from '@base_ui/react/Field';

function classNames(...classes: Array<string | undefined | null | false>) {
  return classes.filter(Boolean).join(' ');
}

function useIsDarkMode() {
  const theme = useTheme();
  return theme.palette.mode === 'dark';
}

function Label(props: React.ComponentPropsWithoutRef<'label'>) {
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
                  <CheckIcon className="w-full h-full" />
                </Indicator>
              </Checkbox>
              Red
            </Label>
            <Label>
              <Checkbox name="green">
                <Indicator>
                  <CheckIcon className="w-full h-full" />
                </Indicator>
              </Checkbox>
              Green
            </Label>
            <Label>
              <Checkbox name="blue">
                <Indicator>
                  <CheckIcon className="w-full h-full" />
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

const Checkbox = React.forwardRef<HTMLButtonElement, BaseCheckbox.Root.Props>(
  function Checkbox(props, ref) {
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
  },
);

const Indicator = React.forwardRef<HTMLSpanElement, BaseCheckbox.Indicator.Props>(
  function Indicator(props, ref) {
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
        <CheckIcon className="w-full h-full" />
      </BaseCheckbox.Indicator>
    );
  },
);

function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
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
