'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../../internals/types';
import { SelectGroupContext } from './SelectGroupContext';
import { SelectGroupCollectionProvider } from '../collection/SelectGroupCollectionContext';
import { useRenderElement } from '../../internals/useRenderElement';

/**
 * Groups related select items with the corresponding label.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
export const SelectGroup = React.forwardRef(function SelectGroup(
  componentProps: SelectGroup.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, style, items, ...elementProps } = componentProps;

  const [labelId, setLabelId] = React.useState<string | undefined>();

  const contextValue: SelectGroupContext = React.useMemo(
    () => ({
      labelId,
      setLabelId,
    }),
    [labelId, setLabelId],
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
    <SelectGroupContext.Provider value={contextValue}>{element}</SelectGroupContext.Provider>
  );

  if (items) {
    return (
      <SelectGroupCollectionProvider items={items}>{wrappedElement}</SelectGroupCollectionProvider>
    );
  }

  return wrappedElement;
});

export interface SelectGroupState {}

export interface SelectGroupProps extends BaseUIComponentProps<'div', SelectGroupState> {
  /**
   * The items of this group.
   * When provided, child `Collection` components will use these items.
   */
  items?: readonly any[] | undefined;
}

export namespace SelectGroup {
  export type State = SelectGroupState;
  export type Props = SelectGroupProps;
}
