'use client';
import * as React from 'react';
import { Checkbox as BaseCheckbox } from '@base-ui-components/react/checkbox';
import { useTheme } from '@mui/system';

function classNames(...classes: Array<string | undefined | null | false>) {
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

const Checkbox = React.forwardRef<HTMLButtonElement, BaseCheckbox.Root.Props>(
  function Checkbox(props, ref) {
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
