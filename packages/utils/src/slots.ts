import * as React from 'react';

export type PropsFromSlot<
  Slot extends React.JSXElementConstructor<any> | React.ElementType | null | undefined,
> =
  NonNullable<Slot> extends React.ElementType<infer P>
    ? P
    : React.ComponentProps<NonNullable<Slot>>;
