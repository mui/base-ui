/* eslint-disable react-hooks/rules-of-hooks */
import type * as React from 'react';
import { expectType } from '#test-utils';
import { useRenderElement } from './useRenderElement';
import type { BaseUIEvent } from './types';

const element1 = useRenderElement('div', {}, {});

expectType<React.ReactElement, typeof element1>(element1);

const element2 = useRenderElement(
  'div',
  {},
  {
    enabled: true,
  },
);

expectType<React.ReactElement, typeof element2>(element2);

const element3 = useRenderElement(
  'div',
  {},
  {
    enabled: false,
  },
);

expectType<null, typeof element3>(element3);

const element4 = useRenderElement(
  'div',
  {},
  {
    enabled: Math.random() > 0.5,
  },
);

expectType<React.ReactElement | null, typeof element4>(element4);

// Object props receive an augmented event; getter results do not.
useRenderElement(
  'button',
  {},
  {
    props: [
      {
        onClick(event) {
          event.preventBaseUIHandler();
        },
      },
      (props) => ({
        onClick(event) {
          // @ts-expect-error -- not augmented when the getter's handler is outermost
          event.preventBaseUIHandler();
          props.onClick?.(event);
        },
      }),
    ],
  },
);

declare const handleKeyDown: (event: BaseUIEvent<React.KeyboardEvent<HTMLDivElement>>) => void;

useRenderElement('div', {}, { props: [{ onKeyDown: handleKeyDown }] });

useRenderElement(
  'div',
  {},
  {
    // @ts-expect-error -- getter handlers are not augmented when outermost
    props: [() => ({ onKeyDown: handleKeyDown })],
  },
);
