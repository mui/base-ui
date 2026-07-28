'use client';
import * as React from 'react';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useStore } from '@base-ui/utils/store';
import { useRenderElement } from '../../internals/useRenderElement';
import type { BaseUIComponentProps } from '../../internals/types';
import { useFieldRootContext } from '../../internals/field-root-context/FieldRootContext';
import type { FieldRoot } from '../../field/root/FieldRoot';
import { useComboboxRootContext } from '../root/ComboboxRootContext';
import { selectors } from '../store';
import type { Side } from '../../internals/useAnchorPositioning';
import { triggerStateAttributesMapping } from '../utils/stateAttributesMapping';
import { handleInputPress } from '../utils/handleInputPress';
import { useListEmpty, usePopupSide } from '../utils/parts';
import { contains } from '../../floating-ui-react/utils/element';

/**
 * A wrapper for the input and its associated controls.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
export const ComboboxInputGroup = React.forwardRef(function ComboboxInputGroup(
  componentProps: ComboboxInputGroup.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, style, ...elementProps } = componentProps;

  const { state: fieldState } = useFieldRootContext();
  const store = useComboboxRootContext();

  const open = useStore(store, selectors.open);
  const comboboxDisabled = useStore(store, selectors.disabled);
  const readOnly = useStore(store, selectors.readOnly);
  const hasSelectedValue = useStore(store, selectors.hasSelectedValue);
  const selectionMode = useStore(store, selectors.selectionMode);

  const popupSide = usePopupSide(store);
  const disabled = comboboxDisabled;
  const listEmpty = useListEmpty();
  const placeholder = selectionMode === 'none' ? false : !hasSelectedValue;

  const state: ComboboxInputGroup.State = {
    ...fieldState,
    open,
    disabled,
    readOnly,
    popupSide,
    listEmpty,
    placeholder,
  };

  const setInputGroupElement = useStableCallback((element: HTMLDivElement | null) => {
    store.set('inputGroupElement', element);
  });

  return useRenderElement('div', componentProps, {
    ref: [forwardedRef, setInputGroupElement],
    props: [
      {
        role: 'group',
        onMouseDown(event) {
          handleInputPress(event, store, disabled, readOnly, (target) => {
            return contains(store.state.chipsContainerRef.current, target);
          });
        },
      },
      elementProps,
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
}

export interface ComboboxInputGroupProps extends BaseUIComponentProps<
  'div',
  ComboboxInputGroup.State
> {}

export namespace ComboboxInputGroup {
  export type State = ComboboxInputGroupState;
  export type Props = ComboboxInputGroupProps;
}
