'use client';
import * as React from 'react';
import { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { ComboboxGroupContext } from './ComboboxGroupContext';
import { GroupCollectionProvider } from '../collection/GroupCollectionContext';

/**
 * Groups related items with the corresponding label.
 * Renders a `<div>` element.
 */
export const ComboboxGroup = React.forwardRef(function ComboboxGroup(
  componentProps: ComboboxGroup.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, items, ...elementProps } = componentProps;

  const [labelId, setLabelId] = React.useState<string | undefined>();

  const contextValue = React.useMemo(
    () => ({
      labelId,
      setLabelId,
      items,
    }),
    [labelId, setLabelId, items],
  );

  const element = useRenderElement('div', componentProps, {
    ref: forwardedRef,
    props: [
      {
        role: 'group',
        'aria-labelledby': labelId,
      },
      elementProps,
    ],
  });

  const wrappedElement = (
    <ComboboxGroupContext.Provider value={contextValue}>{element}</ComboboxGroupContext.Provider>
  );

  if (items) {
    return <GroupCollectionProvider items={items}>{wrappedElement}</GroupCollectionProvider>;
  }

  return wrappedElement;
});

export namespace ComboboxGroup {
  export interface State {}

  export interface Props extends BaseUIComponentProps<'div', State> {
    /**
     * Items to be rendered within this group.
     * When provided, child `Collection` components will use these items.
     */
    items?: any[];
  }
}
