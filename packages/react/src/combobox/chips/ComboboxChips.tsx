'use client';
import * as React from 'react';
import { useRenderElement } from '../../utils/useRenderElement';
import { BaseUIComponentProps } from '../../utils/types';
import { ComboboxChipsContext } from './ComboboxChipsContext';
import { CompositeList } from '../../composite/list/CompositeList';
import { useComboboxRootContext } from '../root/ComboboxRootContext';
import { useSelector } from '../../utils/store';
import { selectors } from '../store';

/**
 * A container for the combobox chips in a multiselectable combobox.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
export const ComboboxChips = React.forwardRef(function ComboboxChips(
  componentProps: ComboboxChips.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, ...elementProps } = componentProps;

  const { store } = useComboboxRootContext();
  const open = useSelector(store, selectors.open);

  const [highlightedChipIndex, setHighlightedChipIndex] = React.useState<number | undefined>(
    undefined,
  );

  const chipsRef = React.useRef<Array<HTMLButtonElement | null>>([]);

  const element = useRenderElement('div', componentProps, {
    ref: forwardedRef,
    props: elementProps,
  });

  React.useEffect(() => {
    if (open) {
      setHighlightedChipIndex(undefined);
    }
  }, [open]);

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
