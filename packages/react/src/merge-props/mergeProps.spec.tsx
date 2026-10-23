import * as React from 'react';
import { mergeProps } from './mergeProps';
import type { BaseUIEvent } from '../internals/types';

// Object inputs: handlers receive an augmented event.
mergeProps<'button'>(
  {
    onClick(event) {
      event.preventBaseUIHandler();
    },
  },
  undefined,
);

// A getter's fresh handler may be outermost, so the method may be missing.
mergeProps<'button'>({}, () => ({
  onClick(event) {
    // @ts-expect-error -- not augmented when the getter's handler is outermost
    event.preventBaseUIHandler();
  },
}));

// The documented manual-chaining pattern still type-checks.
mergeProps<'button'>({}, (props) => ({
  onClick(event) {
    if (!event.baseUIHandlerPrevented) {
      props.onClick?.(event);
    }
  },
}));

// A captured handler that expects an augmented event must be passed as an object input.
declare const handleClick: (event: BaseUIEvent<React.MouseEvent<HTMLButtonElement>>) => void;
mergeProps<'button'>({}, { onClick: handleClick });
// @ts-expect-error -- getter handlers are not augmented when outermost
mergeProps<'button'>({}, () => ({ onClick: handleClick }));

// Getters can forward, or opt back into merge semantics with mergeProps.
mergeProps<'button'>({}, (props) => props);
mergeProps<'button'>({}, (props) =>
  mergeProps<'button'>(props, {
    onClick(event) {
      event.preventBaseUIHandler();
    },
  }),
);

// The merged result accepts plain React events and spreads onto JSX.
const merged = mergeProps<'button'>({ onClick() {} }, { onClick() {} });
merged.onClick?.({} as React.MouseEvent<HTMLButtonElement>);
const buttonProps: React.ComponentProps<'button'> = merged;
<button type="button" {...merged} />;
void buttonProps;
