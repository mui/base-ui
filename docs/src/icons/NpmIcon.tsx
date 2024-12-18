import * as React from 'react';

export function NpmIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      fill="currentcolor"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path fillRule="evenodd" clipRule="evenodd" d="M0 0V16H16V0H0ZM13 3H3V13H8V5H11V13H13V3Z" />
    </svg>
  );
}
