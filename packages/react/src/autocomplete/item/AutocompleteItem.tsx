'use client';
import type * as React from 'react';
import { ComboboxItem } from '../../combobox/item/ComboboxItem';
import type { NativeButtonComponentProps } from '../../internals/types';

/**
 * An individual item in the list.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Autocomplete](https://base-ui.com/react/components/autocomplete)
 */
export const AutocompleteItem = ComboboxItem as AutocompleteItem;

export interface AutocompleteItemState {
  /**
   * Whether the item should ignore user interaction.
   */
  disabled: boolean;
  /**
   * Whether the item is highlighted.
   */
  highlighted: boolean;
}

export type AutocompleteItemProps<
  TNativeButton extends boolean = false,
  TElement extends React.ElementType = 'div',
> = Omit<
  NativeButtonComponentProps<TNativeButton, TElement, AutocompleteItem.State, false>,
  'disabled' | 'id' | 'onClick'
> & {
  children?: React.ReactNode;
  /**
   * An optional click handler for the item when selected.
   * It fires when clicking the item with the pointer, as well as when pressing `Enter` with the keyboard if the item is highlighted when the `Input` or `List` element has focus.
   */
  onClick?:
    | NativeButtonComponentProps<TNativeButton, TElement, AutocompleteItem.State, false>['onClick']
    | undefined;
  /**
   * The index of the item in the list. Improves performance when specified by avoiding the need to calculate the index automatically from the DOM.
   */
  index?: number | undefined;
  /**
   * A unique value that identifies this item.
   * @default null
   */
  value?: any;
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean | undefined;
};

export interface AutocompleteItem {
  <TElement extends React.ElementType = 'div'>(
    componentProps: AutocompleteItem.Props<false, TElement> & React.RefAttributes<HTMLElement>,
  ): React.JSX.Element;
  <TElement extends React.ElementType = 'div'>(
    componentProps: AutocompleteItem.Props<true, TElement> & {
      nativeButton: true;
    } & React.RefAttributes<HTMLButtonElement>,
  ): React.JSX.Element;
  <TElement extends React.ElementType = 'div'>(
    componentProps: AutocompleteItem.Props<boolean, TElement> & {
      nativeButton: boolean;
    } & React.RefAttributes<HTMLElement>,
  ): React.JSX.Element;
}

export namespace AutocompleteItem {
  export type State = AutocompleteItemState;
  export type Props<
    TNativeButton extends boolean = false,
    TElement extends React.ElementType = 'div',
  > = AutocompleteItemProps<TNativeButton, TElement>;
}
