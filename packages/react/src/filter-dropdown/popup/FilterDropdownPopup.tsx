'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import type { StateAttributesMapping } from '../../internals/getStateAttributesProps';
import { popupStateMapping } from '../../utils/popupStateMapping';
import { useFilterDropdownRootContext } from '../root/FilterDropdownRootContext';
import { resolveRenderedId } from '../../internals/resolveRenderedId';
import { useBaseUiId } from '../../internals/useBaseUiId';
import { resolveMenuPopupLabel } from '../../menu/popup/resolveMenuPopupLabel';
import { useFilterDropdownPopup } from './useFilterDropdownPopup';

const stateAttributesMapping: StateAttributesMapping<FilterDropdownPopupState> = {
  open: popupStateMapping.open,
};

/**
 * @internal
 */
export const FilterDropdownPopup = React.forwardRef(function FilterDropdownPopup(
  componentProps: FilterDropdownPopup.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, style, id: idProp, ...elementProps } = componentProps;

  const context = useFilterDropdownRootContext();
  const id = resolveRenderedId(componentProps, useBaseUiId());
  const { ariaLabelledBy } = resolveMenuPopupLabel(componentProps, null, context.triggerId ?? null);

  const interactionProps = useFilterDropdownPopup();
  const state: FilterDropdownPopupState = { open: context.open };

  return useRenderElement('div', componentProps, {
    state,
    ref: forwardedRef,
    props: [
      { id, role: 'dialog', 'aria-labelledby': ariaLabelledBy },
      interactionProps,
      elementProps,
    ],
    stateAttributesMapping,
  });
});

export interface FilterDropdownPopupState {
  /**
   * Whether the popup is open.
   */
  open: boolean;
}

export interface FilterDropdownPopupProps extends BaseUIComponentProps<
  'div',
  FilterDropdownPopupState
> {
  id?: string | undefined;
}

export namespace FilterDropdownPopup {
  export type Props = FilterDropdownPopupProps;
  export type State = FilterDropdownPopupState;
}
