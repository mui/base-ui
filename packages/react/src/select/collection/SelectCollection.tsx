'use client';
import * as React from 'react';
import { useSelectRootContext } from '../root/SelectRootContext';
import { useSelectGroupCollectionContext } from './SelectGroupCollectionContext';

/**
 * Renders list items from the root's data source.
 * Doesn't render its own HTML element.
 *
 * If rendering a flat list, pass a function child to the `List` component instead, which implicitly wraps it.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
export function SelectCollection(props: SelectCollection.Props): React.JSX.Element {
  const { children } = props;

  const { items } = useSelectRootContext();
  const groupContext = useSelectGroupCollectionContext();

  const itemsToRender = groupContext ? groupContext.items : items;

  return <React.Fragment>{itemsToRender.map(children)}</React.Fragment>;
}

export interface SelectCollectionState {}

export interface SelectCollectionProps {
  children: (item: any, index: number) => React.ReactNode;
}

export namespace SelectCollection {
  export type State = SelectCollectionState;
  export type Props = SelectCollectionProps;
}
