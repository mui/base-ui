'use client';
import * as React from 'react';
import { useSelectDerivedItemsContext } from '../root/SelectDerivedItemsContext';
import { useSelectGroupCollectionContext } from './SelectGroupCollectionContext';

/**
 * Renders filtered list items.
 * Doesn't render its own HTML element.
 *
 * If rendering a flat list, pass a function child to the `List` component instead, which implicitly wraps it.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
export function SelectCollection(props: SelectCollection.Props): React.JSX.Element {
  const { children } = props;

  const { filteredItems } = useSelectDerivedItemsContext();
  const groupContext = useSelectGroupCollectionContext();

  const itemsToRender = groupContext ? groupContext.items : filteredItems;

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
