'use client';
import * as React from 'react';
import { Switch as BaseSwitch } from '@base-ui-components/react/switch';
import { useTheme } from '@mui/system';

function useIsDarkMode() {
  const theme = useTheme();
  return theme.palette.mode === 'dark';
}

export default function UnstyledSwitchIntroduction() {
  // Replace this with your app logic for determining dark modes
  const isDarkMode = useIsDarkMode();

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <Switch aria-label="Basic switch, on by default" defaultChecked>
        <Thumb />
      </Switch>
      <Switch aria-label="Basic switch, off by default">
        <Thumb />
      </Switch>
      <Switch aria-label="Disabled switch, on by default" defaultChecked disabled>
        <Thumb />
      </Switch>
      <Switch aria-label="Disabled switch, off by default" disabled>
        <Thumb />
      </Switch>
    </div>
  );
}

const Switch = React.forwardRef<HTMLButtonElement, BaseSwitch.Root.Props>(
  function Switch({ className: classNameProp = '', ...props }, ref) {
    const className = ({ checked }: BaseSwitch.Root.State) =>
      `group relative inline-block w-[38px] h-[24px] m-2.5 p-0 transition rounded-full
    border border-solid outline-none border-gray-300 dark:border-gray-700
    focus-visible:shadow-outline-switch
    cursor-pointer data-[disabled]:cursor-not-allowed data-[disabled]:opacity-40
    ${checked ? 'bg-gray-500' : 'bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-800'}
    ${classNameProp}`;

    return <BaseSwitch.Root {...props} ref={ref} className={className} />;
  },
);

const Thumb = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(function Thumb({ className: classNameProp = '', ...props }, ref) {
  const className = ({ checked }: BaseSwitch.Root.State) =>
    `block w-4 h-4 rounded-2xl border border-solid outline-none border-gray-300 dark:border-gray-700 transition
  shadow-[0_1px_2px_rgb(0_0_0_/_0.1)] dark:shadow-[0_1px_2px_rgb(0_0_0_/_0.25)]
  relative transition-all
  ${checked ? 'left-[18px] bg-white shadow-[0_0_0_rgb(0_0_0_/_0.3)]' : 'left-[4px] bg-white'}
  ${classNameProp}`;

  return <BaseSwitch.Thumb {...props} ref={ref} className={className} />;
});
