import * as React from 'react';

export function MoreVertIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="currentcolor"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <circle cx="7" cy="2.5" r="1.25" />
      <circle cx="7" cy="7" r="1.25" />
      <circle cx="7" cy="11.5" r="1.25" />
    </svg>
  );
}
