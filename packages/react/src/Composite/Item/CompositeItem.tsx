'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useForkRef } from '../../utils/useForkRef';
import { useCompositeRootContext } from '../Root/CompositeRootContext';
import { useCompositeItem } from './useCompositeItem';
import type { BaseUIComponentProps } from '../../utils/types';

/**
 * @ignore - internal component.
 */
function CompositeItem<Metadata>(props: CompositeItem.Props<Metadata>) {
  const { render, className, itemRef, metadata, ...otherProps } = props;

  const { activeIndex } = useCompositeRootContext();
  const { getItemProps, ref, index } = useCompositeItem({ metadata });

  const ownerState: CompositeItem.OwnerState = React.useMemo(
    () => ({
      active: index === activeIndex,
    }),
    [index, activeIndex],
  );

  const mergedRef = useForkRef(itemRef, ref);

  const { renderElement } = useComponentRenderer({
    propGetter: getItemProps,
    ref: mergedRef,
    render: render ?? 'div',
    ownerState,
    className,
    extraProps: otherProps,
  });

  return renderElement();
}

namespace CompositeItem {
  export interface OwnerState {
    active: boolean;
  }

  export interface Props<Metadata>
    extends Omit<BaseUIComponentProps<'div', OwnerState>, 'itemRef'> {
    // the itemRef name collides with https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/itemref
    itemRef?: React.RefObject<HTMLElement | null>;
    metadata?: Metadata;
  }
}

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
   * Class names applied to the element or a function that returns them based on the component's state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * @ignore
   */
  itemRef: PropTypes.shape({
    current: (props, propName) => {
      if (props[propName] == null) {
        return null;
      }
      if (typeof props[propName] !== 'object' || props[propName].nodeType !== 1) {
        return new Error(`Expected prop '${propName}' to be of type Element`);
      }
      return null;
    },
  }),
  /**
   * @ignore
   */
  metadata: PropTypes.any,
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { CompositeItem };
