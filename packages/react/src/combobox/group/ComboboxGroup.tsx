'use client';
import * as React from 'react';
import { useStore } from '@base-ui/utils/store';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { ComboboxGroupContext } from './ComboboxGroupContext';
import { GroupCollectionProvider } from '../collection/GroupCollectionContext';
import {
  useComboboxDerivedItemsContext,
  useComboboxRootContext,
} from '../root/ComboboxRootContext';
import { selectors } from '../store';

/**
 * Groups related items with the corresponding label.
 * Renders a `<div>` element.
 */
export const ComboboxGroup = React.forwardRef(function ComboboxGroup(
  componentProps: ComboboxGroup.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, items: groupItems, ...elementProps } = componentProps;

  const store = useComboboxRootContext();
  const { filterQuery } = useComboboxDerivedItemsContext();
  const items = useStore(store, selectors.items);
  const hasFilteredItemsProp = useStore(store, selectors.hasFilteredItemsProp);
  const shouldFilterByQuery = !items && !hasFilteredItemsProp;

  const [labelId, setLabelId] = React.useState<string | undefined>();
  const [visibleItemCount, setVisibleItemCount] = React.useState(0);

  const registerVisibleItem = useStableCallback(() => {
    setVisibleItemCount((count) => count + 1);
    return () => {
      setVisibleItemCount((count) => Math.max(0, count - 1));
    };
  });

  const shouldRenderGroup = !shouldFilterByQuery || filterQuery === '' || visibleItemCount > 0;

  const contextValue = React.useMemo(
    () => ({
      labelId,
      setLabelId,
      items: groupItems,
      registerVisibleItem,
    }),
    [labelId, setLabelId, groupItems, registerVisibleItem],
  );

  const element = useRenderElement('div', componentProps, {
    ref: forwardedRef,
    props: [
      {
        role: 'group',
        'aria-labelledby': labelId,
        hidden: !shouldRenderGroup,
      },
      elementProps,
    ],
  });

  const wrappedElement = (
    <ComboboxGroupContext.Provider value={contextValue}>{element}</ComboboxGroupContext.Provider>
  );

  if (groupItems) {
    return <GroupCollectionProvider items={groupItems}>{wrappedElement}</GroupCollectionProvider>;
  }

  return wrappedElement;
});

export interface ComboboxGroupState {}

export interface ComboboxGroupProps extends BaseUIComponentProps<'div', ComboboxGroup.State> {
  /**
   * Items to be rendered within this group.
   * When provided, child `Collection` components will use these items.
   */
  items?: readonly any[] | undefined;
}

export namespace ComboboxGroup {
  export type State = ComboboxGroupState;
  export type Props = ComboboxGroupProps;
}
