'use client';
import * as React from 'react';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useStore } from '@base-ui/utils/store';
import { useRenderElement } from '../../utils/useRenderElement';
import { BaseUIComponentProps } from '../../utils/types';
import { useFieldRootContext } from '../../field/root/FieldRootContext';
import type { FieldRoot } from '../../field/root/FieldRoot';
import { contains } from '../../floating-ui-react/utils';
import {
  useComboboxDerivedItemsContext,
  useComboboxRootContext,
} from '../root/ComboboxRootContext';
import { selectors } from '../store';
import type { Side } from '../../utils/useAnchorPositioning';
import { triggerStateAttributesMapping } from '../utils/stateAttributesMapping';

/**
 * A wrapper for the input and its associated controls.
 * Renders a `<div>` element.
 */
export const ComboboxInputGroup = React.forwardRef(function ComboboxInputGroup(
  componentProps: ComboboxInputGroup.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, disabled: disabledProp = false, ...elementProps } = componentProps;

  const { state: fieldState, disabled: fieldDisabled } = useFieldRootContext();
  const store = useComboboxRootContext();
  const { filteredItems } = useComboboxDerivedItemsContext();

  const open = useStore(store, selectors.open);
  const mounted = useStore(store, selectors.mounted);
  const popupSideValue = useStore(store, selectors.popupSide);
  const positionerElement = useStore(store, selectors.positionerElement);
  const comboboxDisabled = useStore(store, selectors.disabled);
  const readOnly = useStore(store, selectors.readOnly);
  const hasSelectedValue = useStore(store, selectors.hasSelectedValue);
  const selectionMode = useStore(store, selectors.selectionMode);
  const activeIndex = useStore(store, selectors.activeIndex);
  const highlightReason = useStore(store, selectors.highlightReason);

  const [focusWithin, setFocusWithin] = React.useState(false);

  const popupSide = mounted && positionerElement ? popupSideValue : null;
  const disabled = fieldDisabled || comboboxDisabled || disabledProp;
  const listEmpty = filteredItems.length === 0;
  const placeholder = selectionMode === 'none' ? false : !hasSelectedValue;
  const highlighted = focusWithin && activeIndex === null && highlightReason === 'keyboard';

  const state: ComboboxInputGroup.State = React.useMemo(
    () => ({
      ...fieldState,
      open,
      disabled,
      readOnly,
      popupSide,
      listEmpty,
      placeholder,
      highlighted,
    }),
    [fieldState, open, disabled, readOnly, popupSide, listEmpty, placeholder, highlighted],
  );

  const setInputGroupElement = useStableCallback((element: HTMLDivElement | null) => {
    store.set('inputGroupElement', element);
  });

  return useRenderElement('div', componentProps, {
    ref: [forwardedRef, setInputGroupElement],
    props: [
      elementProps,
      {
        onFocus() {
          setFocusWithin(true);
        },
        onBlur(event) {
          const relatedTarget = event.relatedTarget as Element | null;
          if (contains(event.currentTarget, relatedTarget)) {
            return;
          }
          setFocusWithin(false);
        },
      },
    ],
    state,
    stateAttributesMapping: triggerStateAttributesMapping,
  });
});

export interface ComboboxInputGroupState extends FieldRoot.State {
  /**
   * Whether the corresponding popup is open.
   */
  open: boolean;
  /**
   * Whether the component should ignore user interaction.
   */
  disabled: boolean;
  /**
   * Whether the component should ignore user edits.
   */
  readOnly: boolean;
  /**
   * Indicates which side the corresponding popup is positioned relative to its anchor.
   */
  popupSide: Side | null;
  /**
   * Present when the corresponding items list is empty.
   */
  listEmpty: boolean;
  /**
   * Whether the combobox doesn't have a value.
   */
  placeholder: boolean;
  /**
   * Present when no item is highlighted in the list, focus is within the input group,
   * and the last highlight change was from keyboard navigation.
   */
  highlighted: boolean;
}

export interface ComboboxInputGroupProps extends BaseUIComponentProps<
  'div',
  ComboboxInputGroup.State
> {
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean | undefined;
}

export namespace ComboboxInputGroup {
  export type State = ComboboxInputGroupState;
  export type Props = ComboboxInputGroupProps;
}
