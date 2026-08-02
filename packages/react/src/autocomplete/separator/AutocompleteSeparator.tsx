'use client';
import type * as React from 'react';
import { ListboxSeparator } from '../../utils/listbox-separator/ListboxSeparator';
import type { BaseUIComponentProps, Orientation } from '../../internals/types';

export interface AutocompleteSeparatorProps extends BaseUIComponentProps<
  'div',
  AutocompleteSeparatorState
> {
  /**
   * The orientation of the separator.
   * @default 'horizontal'
   */
  orientation?: Orientation | undefined;
}

export interface AutocompleteSeparatorState {
  /**
   * The orientation of the separator.
   */
  orientation: Orientation;
}

/**
 * A visual separator between Autocomplete items or groups.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Autocomplete](https://base-ui.com/react/components/autocomplete)
 */
export const AutocompleteSeparator = ListboxSeparator as React.ForwardRefExoticComponent<
  AutocompleteSeparatorProps & React.RefAttributes<HTMLDivElement>
>;

export namespace AutocompleteSeparator {
  export type Props = AutocompleteSeparatorProps;
  export type State = AutocompleteSeparatorState;
}
