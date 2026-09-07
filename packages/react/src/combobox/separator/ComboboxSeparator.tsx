'use client';
import type * as React from 'react';
import { ListboxSeparator } from '../../utils/listbox-separator/ListboxSeparator';
import type { BaseUIComponentProps, Orientation } from '../../internals/types';

export interface ComboboxSeparatorProps extends BaseUIComponentProps<
  'div',
  ComboboxSeparatorState
> {
  /**
   * The orientation of the separator.
   * @default 'horizontal'
   */
  orientation?: Orientation | undefined;
}

export interface ComboboxSeparatorState {
  /**
   * The orientation of the separator.
   */
  orientation: Orientation;
}

/**
 * A visual separator between items or groups.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
export const ComboboxSeparator = ListboxSeparator as React.ForwardRefExoticComponent<
  ComboboxSeparatorProps & React.RefAttributes<HTMLDivElement>
>;

export namespace ComboboxSeparator {
  export type Props = ComboboxSeparatorProps;
  export type State = ComboboxSeparatorState;
}
