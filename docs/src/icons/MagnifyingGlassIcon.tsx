import * as React from 'react';

export function MagnifyingGlassIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeLinecap="square"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m10.5 10.5 4 4" />
      <circle cx="6.5" cy="6.5" r="5" />
    </svg>
  );
}
