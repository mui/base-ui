'use client';
import * as React from 'react';
import { useStore } from '@base-ui-components/utils/store';
import { useRenderElement } from '../../utils/useRenderElement';
import { BaseUIComponentProps } from '../../utils/types';
import { ComboboxChipsContext } from './ComboboxChipsContext';
import { CompositeList } from '../../composite/list/CompositeList';
import { useComboboxRootContext } from '../root/ComboboxRootContext';
import { selectors } from '../store';

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

  const chipsContainerRef = useStore(store, selectors.chipsContainerRef);
  const open = useStore(store, selectors.open);

  const [highlightedChipIndex, setHighlightedChipIndex] = React.useState<number | undefined>(
    undefined,
  );

  if (open && highlightedChipIndex !== undefined) {
    setHighlightedChipIndex(undefined);
  }

  const chipsRef = React.useRef<Array<HTMLButtonElement | null>>([]);

  const element = useRenderElement('div', componentProps, {
    ref: [forwardedRef, chipsContainerRef],
    props: elementProps,
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

export namespace ComboboxChips {
  export interface State {}

  export interface Props extends BaseUIComponentProps<'div', State> {}
}
