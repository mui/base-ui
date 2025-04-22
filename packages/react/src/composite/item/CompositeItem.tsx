'use client';
import * as React from 'react';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useForkRef } from '../../utils/useForkRef';
import { useCompositeRootContext } from '../root/CompositeRootContext';
import { useCompositeItem } from './useCompositeItem';
import type { BaseUIComponentProps } from '../../utils/types';

/**
 * @internal
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
