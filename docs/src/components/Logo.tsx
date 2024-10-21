import clsx from 'clsx';
import * as React from 'react';

export function Logo({ className, ...props }: React.ComponentProps<'svg'>) {
  return (
    <svg
      aria-label="Base UI"
      className={clsx('Logo', className)}
      width="70"
      height="16"
      viewBox="0 0 70 16"
      fill="currentcolor"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        className="Logo-B"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 0H4H0V4V6V10V12V16H4H12H16V12V10L14 8L16 6V4V0H12ZM12 12V10H4V12H12ZM12 6H4V4H12V6Z"
      />
      <path
        className="Logo-E"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M68.5 0H56.5H52.5V4V6V10V12V16H56.5H68.5V12H56.5V10H68.5V6H56.5V4H68.5V0Z"
      />
      <path
        className="Logo-S"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M39 0H51V4H39V6H47H51V10V12V16H47H35V12H47V10H39H35V6V4V0H39Z"
      />
      <path
        className="Logo-A"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M17.5 0H29.5H30.5L33.5 3V6V10V12V16H29.5H21.5H17.5V12V10V6H21.5H29.5V4H17.5V0ZM29.5 10H21.5V12H29.5V10Z"
      />
    </svg>
  );
}
