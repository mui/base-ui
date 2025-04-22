'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { mergeProps } from '../../merge-props';
import { useScrollAreaRootContext } from '../root/ScrollAreaRootContext';
import { useForkRef } from '../../utils/useForkRef';

const state = {};

/**
 * A small rectangular area that appears at the intersection of horizontal and vertical scrollbars.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Scroll Area](https://base-ui.com/react/components/scroll-area)
 */
const ScrollAreaCorner = React.forwardRef(function ScrollAreaCorner(
  props: ScrollAreaCorner.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, ...otherProps } = props;

  const { cornerRef, cornerSize, hiddenState } = useScrollAreaRootContext();

  const mergedRef = useForkRef(cornerRef, forwardedRef);

  const { renderElement } = useComponentRenderer({
    render: render ?? 'div',
    ref: mergedRef,
    className,
    state,
    extraProps: mergeProps(
      {
        style: {
          position: 'absolute',
          bottom: 0,
          insetInlineEnd: 0,
          width: cornerSize.width,
          height: cornerSize.height,
        },
      },
      otherProps,
    ),
  });

  if (hiddenState.cornerHidden) {
    return null;
  }

  return renderElement();
});

namespace ScrollAreaCorner {
  export interface State {}

  export interface Props extends BaseUIComponentProps<'div', State> {}
}

export { ScrollAreaCorner };
