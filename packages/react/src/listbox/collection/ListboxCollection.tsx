'use client';
import * as React from 'react';
import { error } from '@base-ui/utils/error';
import { useListboxRootContext } from '../root/ListboxRootContext';
import { ListboxGroupContext } from '../group/ListboxGroupContext';

/**
 * Renders the items passed to the root's `items` prop, or the items of the group it's in.
 * Doesn't render its own HTML element.
 *
 * To render nothing but the items in the list, pass a function child to the `List` component
 * instead, which implicitly wraps it.
 *
 * Documentation: [Base UI Listbox](https://base-ui.com/react/components/listbox)
 */
export function ListboxCollection(props: ListboxCollection.Props): React.JSX.Element {
  const { children } = props;

  const store = useListboxRootContext();
  const items = store.useState('items');
  const groupItems = React.useContext(ListboxGroupContext)?.items;

  if (process.env.NODE_ENV !== 'production') {
    // The build-time environment never changes during a component's lifetime.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    React.useEffect(() => {
      if (items == null && groupItems == null) {
        error(
          '<Listbox.Collection> and a function child of <Listbox.List> render the `items` of ' +
            '<Listbox.Root>, which has none, so nothing is rendered. Pass `items` to <Listbox.Root>.',
        );
      }
    }, [items, groupItems]);
  }

  const itemsToRender = groupItems ?? items?.groups ?? items?.list ?? [];

  return <React.Fragment>{itemsToRender.map(children)}</React.Fragment>;
}

export interface ListboxCollectionState {}

export interface ListboxCollectionProps {
  /**
   * A function that renders an item. Outside a group, with grouped `items`, it receives each
   * group instead.
   */
  children: (item: any, index: number) => React.ReactNode;
}

export namespace ListboxCollection {
  export type State = ListboxCollectionState;
  export type Props = ListboxCollectionProps;
}
