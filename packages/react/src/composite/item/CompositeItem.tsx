'use client';
import * as React from 'react';
import { useRenderElement } from '../../utils/useRenderElement';
import { useCompositeItem } from './useCompositeItem';
import type { BaseUIComponentProps } from '../../utils/types';

/**
 * @internal
 */
export function CompositeItem<Metadata>(componentProps: CompositeItem.Props<Metadata>) {
  const { render, className, itemRef = null, metadata, ...elementProps } = componentProps;

  const { props, ref } = useCompositeItem({ metadata });

  return useRenderElement('div', componentProps, {
    ref: [itemRef, ref],
    props: [props, elementProps],
  });
}

export namespace CompositeItem {
  export interface State {}

  export interface Props<Metadata> extends Omit<BaseUIComponentProps<'div', State>, 'itemRef'> {
    // the itemRef name collides with https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/itemref
    itemRef?: React.RefObject<HTMLElement | null>;
    metadata?: Metadata;
  }
}
