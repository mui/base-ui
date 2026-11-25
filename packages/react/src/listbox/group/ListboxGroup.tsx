'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import { ListboxGroupContext } from './ListboxGroupContext';

/**
 * Groups related listbox items with the corresponding label.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Listbox](https://base-ui.com/react/components/listbox)
 */
export const ListboxGroup = React.forwardRef(function ListboxGroup(
  componentProps: ListboxGroup.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, style, items, ...elementProps } = componentProps;

  const [labelId, setLabelId] = React.useState<string | undefined>();

  const contextValue: ListboxGroupContext = React.useMemo(
    () => ({
      setLabelId,
      items,
    }),
    [setLabelId, items],
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

  return (
    <ListboxGroupContext.Provider value={contextValue}>{element}</ListboxGroupContext.Provider>
  );
});

export interface ListboxGroupState {}
export interface ListboxGroupProps extends BaseUIComponentProps<'div', ListboxGroupState> {
  /**
   * The items of this group.
   * When provided, a `Listbox.Collection` inside the group renders these items.
   */
  items?: readonly any[] | undefined;
}

export namespace ListboxGroup {
  export type State = ListboxGroupState;
  export type Props = ListboxGroupProps;
}
