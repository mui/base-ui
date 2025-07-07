'use client';
import * as React from 'react';
import clsx from 'clsx';
import { TableCode } from '../TableCode';

export function Chip(props: React.ComponentProps<'code'>) {
  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
    <span
      // allows text selection using click+drag or double click  without
      // triggering an interactive parent
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
      onMouseDown={(event) => event.stopPropagation()}
    >
      <TableCode
        {...props}
        className={clsx(
          'text-navy bg-(--color-gray-100) rounded-sm p-1 -m-1 hover:cursor-text',
          props.className,
        )}
      />
    </span>
  );
}
