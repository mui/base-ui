'use client';
import * as React from 'react';
import { useRenderElement } from '../../utils/useRenderElement';
import { useCompositeRootContext } from '../root/CompositeRootContext';
import { useCompositeItem } from './useCompositeItem';
import type { BaseUIComponentProps } from '../../utils/types';

/**
 * @internal
 */
export function CompositeItem<Metadata>(componentProps: CompositeItem.Props<Metadata>) {
  const { render, className, itemRef = null, metadata, ...elementProps } = componentProps;

  const { highlightedIndex } = useCompositeRootContext();
  const { props, ref, index } = useCompositeItem({ metadata });

  const state: CompositeItem.State = React.useMemo(
    () => ({
      highlighted: index === highlightedIndex,
    }),
    [index, highlightedIndex],
  );

  const element = useRenderElement('div', componentProps, {
    state,
    ref: [itemRef, ref],
    props: [props, elementProps],
  });

  return element;
}

export namespace CompositeItem {
  export interface State {
    highlighted: boolean;
  }

  export interface Props<Metadata> extends Omit<BaseUIComponentProps<'div', State>, 'itemRef'> {
    // the itemRef name collides with https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/itemref
    itemRef?: React.RefObject<HTMLElement | null>;
    metadata?: Metadata;
  }
}
