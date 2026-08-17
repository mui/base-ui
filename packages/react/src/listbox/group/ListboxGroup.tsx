'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import { useBaseUiId } from '../../internals/useBaseUiId';
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
  const { className, render, style, ...elementProps } = componentProps;

  const [labelId, setLabelId] = React.useState<string | undefined>();
  const groupId = useBaseUiId() ?? '';

  const contextValue: ListboxGroupContext = React.useMemo(
    () => ({
      labelId,
      setLabelId,
      groupId,
    }),
    [labelId, setLabelId, groupId],
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
export interface ListboxGroupProps extends BaseUIComponentProps<'div', ListboxGroupState> {}

export namespace ListboxGroup {
  export type State = ListboxGroupState;
  export type Props = ListboxGroupProps;
}
