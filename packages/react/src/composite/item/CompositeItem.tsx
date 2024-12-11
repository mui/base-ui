'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useForkRef } from '../../utils/useForkRef';
import { useCompositeRootContext } from '../root/CompositeRootContext';
import { useCompositeItem } from './useCompositeItem';
import { refType } from '../../utils/proptypes';
import type { BaseUIComponentProps } from '../../utils/types';

/**
 * @ignore - internal component.
 */
function CompositeItem<Metadata>(props: CompositeItem.Props<Metadata>) {
  const { render, className, itemRef, metadata, ...otherProps } = props;

  const { highlightedIndex } = useCompositeRootContext();
  const { getItemProps, ref, index } = useCompositeItem({ metadata });

  const state: CompositeItem.State = React.useMemo(
    () => ({
      highlighted: index === highlightedIndex,
    }),
    [index, highlightedIndex],
  );

  const mergedRef = useForkRef(itemRef, ref);

  const { renderElement } = useComponentRenderer({
    propGetter: getItemProps,
    ref: mergedRef,
    render: render ?? 'div',
    state,
    className,
    extraProps: otherProps,
  });

  return renderElement();
}

namespace CompositeItem {
  export interface State {
    highlighted: boolean;
  }

  export interface Props<Metadata> extends Omit<BaseUIComponentProps<'div', State>, 'itemRef'> {
    // the itemRef name collides with https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/itemref
    itemRef?: React.RefObject<HTMLElement | null>;
    metadata?: Metadata;
  }
}

export { CompositeItem };

CompositeItem.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * CSS class applied to the element, or a function that
   * returns a class based on the component’s state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * @ignore
   */
  itemRef: refType,
  /**
   * @ignore
   */
  metadata: PropTypes.any,
  /**
   * Allows you to replace the default HTML element that the component
   * renders with another element, or compose it with another component.
   * Accepts a `ReactElement` or a function that returns the element to render.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;
