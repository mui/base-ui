'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import type { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { useScrollAreaRootContext } from '../Root/ScrollAreaRootContext';
import { useForkRef } from '../../utils/useForkRef';

const ownerState = {};

/**
 *
 * Demos:
 *
 * - [Scroll Area](https://base-ui.netlify.app/components/react-scroll-area/)
 *
 * API:
 *
 * - [ScrollAreaCorner API](https://base-ui.netlify.app/components/react-scroll-area/#api-reference-ScrollAreaCorner)
 */
const ScrollAreaCorner = React.forwardRef(function ScrollAreaCorner(
  props: ScrollAreaCorner.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, ...otherProps } = props;

  const { dir, cornerRef, cornerSize, hiddenState } = useScrollAreaRootContext();

  const mergedRef = useForkRef(cornerRef, forwardedRef);

  const { renderElement } = useComponentRenderer({
    render: render ?? 'div',
    ref: mergedRef,
    className,
    ownerState,
    extraProps: mergeReactProps(otherProps, {
      style: {
        position: 'absolute',
        bottom: 0,
        [dir === 'rtl' ? 'left' : 'right']: 0,
        width: cornerSize.width,
        height: cornerSize.height,
      },
    }),
  });

  if (hiddenState.cornerHidden) {
    return null;
  }

  return renderElement();
});

namespace ScrollAreaCorner {
  export interface OwnerState {}

  export interface Props extends BaseUIComponentProps<'div', OwnerState> {}
}

ScrollAreaCorner.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * Class names applied to the element or a function that returns them based on the component's state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { ScrollAreaCorner };
