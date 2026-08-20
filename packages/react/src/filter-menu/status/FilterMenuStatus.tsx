'use client';
import {
  ComboboxStatus,
  type ComboboxStatusProps,
  type ComboboxStatusState,
} from '../../combobox/status/ComboboxStatus';

/**
 * A status message whose content changes are announced politely to screen readers.
 * Useful for conveying the status of an asynchronously loaded list.
 * This component's root element must remain mounted in the DOM to announce changes consistently
 * across screen readers. Avoid hiding or removing the root element, and apply layout styles to a
 * child element instead.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Filter Menu](https://base-ui.com/react/components/filter-menu)
 */
export const FilterMenuStatus = ComboboxStatus;

export interface FilterMenuStatusState extends ComboboxStatusState {}
export interface FilterMenuStatusProps extends ComboboxStatusProps {}

export namespace FilterMenuStatus {
  export type State = FilterMenuStatusState;
  export type Props = FilterMenuStatusProps;
}
