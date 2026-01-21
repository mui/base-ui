'use client';
import * as React from 'react';
import { useStore } from '@base-ui/utils/store';
import { useRenderElement } from '../../utils/useRenderElement';
import { BaseUIComponentProps } from '../../utils/types';
import { ComboboxChipsContext } from './ComboboxChipsContext';
import { CompositeList } from '../../composite/list/CompositeList';
import { useComboboxRootContext } from '../root/ComboboxRootContext';
import { selectors } from '../store';
import { EMPTY_OBJECT } from '../../utils/constants';

/**
 * A container for the chips in a multiselectable input.
 * Renders a `<div>` element.
 */
export const ComboboxChips = React.forwardRef(function ComboboxChips(
  componentProps: ComboboxChips.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, ...elementProps } = componentProps;

  const store = useComboboxRootContext();

  const open = useStore(store, selectors.open);
  const hasSelectionChips = useStore(store, selectors.hasSelectionChips);

  const [highlightedChipIndex, setHighlightedChipIndex] = React.useState<number | undefined>(
    undefined,
  );

  if (open && highlightedChipIndex !== undefined) {
    setHighlightedChipIndex(undefined);
  }

  const chipsRef = React.useRef<Array<HTMLButtonElement | null>>([]);

  const element = useRenderElement('div', componentProps, {
    ref: [forwardedRef, store.state.chipsContainerRef],
    // NVDA enters browse mode instead of staying in focus mode when navigating with
    // arrow keys inside a container unless it has a toolbar role.
    props: [hasSelectionChips ? { role: 'toolbar' } : EMPTY_OBJECT, elementProps],
  });

  const contextValue: ComboboxChipsContext = React.useMemo(
    () => ({
      highlightedChipIndex,
      setHighlightedChipIndex,
      chipsRef,
    }),
    [highlightedChipIndex, setHighlightedChipIndex, chipsRef],
  );

  return (
    <ComboboxChipsContext.Provider value={contextValue}>
      <CompositeList elementsRef={chipsRef}>{element}</CompositeList>
    </ComboboxChipsContext.Provider>
  );
});

export interface ComboboxChipsState {}

export interface ComboboxChipsProps extends BaseUIComponentProps<'div', ComboboxChips.State> {}

export namespace ComboboxChips {
  export type State = ComboboxChipsState;
  export type Props = ComboboxChipsProps;
}
