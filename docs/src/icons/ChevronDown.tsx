import * as React from 'react';

export function ChevronDownIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M1 3.5L5 7.5L9 3.5" stroke="currentcolor" />
    </svg>
  );
}
