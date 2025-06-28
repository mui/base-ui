'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../utils/types';
import { useRenderElement } from '../utils/useRenderElement';

/**
 * A component that displays content within a desired ratio (e.g., 16 / 9, 4 / 3).
 *
 * Documentation: [Base UI AspectRatio](https://base-ui.com/react/components/aspect-ratio)
 */
export const AspectRatio = React.forwardRef(function AspectRatio(
  componentProps: AspectRatio.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    className,
    render,
    style,
    children,
    ratio = 1 / 1, // default ratio
    ...elementProps
  } = componentProps;

  const element = useRenderElement('div', componentProps, {
    ref: forwardedRef,
    props: {
      ...elementProps,
      style: {
        ...style,
        // ensures children expand in ratio
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
      },
      children,
    },
  });

  return (
    <div
      style={{
        // ensures inner element is contained
        position: 'relative',
        // ensures padding bottom trick maths works
        width: '100%',
        paddingBottom: `${100 / ratio}%`,
      }}
    >
      {element}
    </div>
  );
});

export namespace AspectRatio {
  export interface Props extends BaseUIComponentProps<'div', State> {
    /**
     * The desired aspect ratio (e.g., 16 / 9, 4 / 3).
     */
    ratio?: number;
  }

  export interface State {}
}
