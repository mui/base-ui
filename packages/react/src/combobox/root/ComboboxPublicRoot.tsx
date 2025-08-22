'use client';
import * as React from 'react';
import { ComboboxRoot as ComboboxRootInternal } from './ComboboxRoot';

/**
 * Groups all parts of the combobox.
 * Doesn't render its own HTML element.
 */
export function ComboboxRoot<Item = any, Multiple extends boolean | undefined = false>(
  props: ComboboxRoot.Props<Item, Multiple>,
): React.JSX.Element {
  const { multiple = false as Multiple, defaultValue, value, onValueChange, ...rest } = props;

  type Mode = ModeFromMultiple<Multiple>;
  const mode = multiple ? 'multiple' : 'single';
  return (
    <ComboboxRootInternal<Item, Mode>
      {...(rest as any)}
      selectionMode={mode}
      selectedValue={value}
      defaultSelectedValue={defaultValue}
      onSelectedValueChange={onValueChange}
    />
  );
}

type ModeFromMultiple<Multiple extends boolean | undefined> = Multiple extends true
  ? 'multiple'
  : 'single';

export namespace ComboboxRoot {
  export type Props<Item, Multiple extends boolean | undefined = false> = Omit<
    ComboboxRootInternal.Props<Item, ModeFromMultiple<Multiple>>,
    | 'clearInputOnCloseComplete'
    | 'modal'
    | 'fillInputOnItemPress'
    | 'autoComplete'
    // Different names
    | 'selectionMode'
    | 'defaultSelectedValue'
    | 'selectedValue'
    | 'onSelectedValueChange'
  > & {
    /**
     * Whether multiple items can be selected.
     * @default false
     */
    multiple?: Multiple;
    /**
     * The uncontrolled selected value of the combobox when it's initially rendered.
     *
     * To render a controlled combobox, use the `value` prop instead.
     */
    defaultValue?: ComboboxRootInternal.Props<
      Item,
      Multiple extends true ? 'multiple' : 'single'
    >['defaultSelectedValue'];
    /**
     * The selected value of the combobox. Use when controlled.
     */
    value?: ComboboxRootInternal.Props<
      Item,
      Multiple extends true ? 'multiple' : 'single'
    >['selectedValue'];
    /**
     * Callback fired when the selected value of the combobox changes.
     */
    onValueChange?: ComboboxRootInternal.Props<
      Item,
      Multiple extends true ? 'multiple' : 'single'
    >['onSelectedValueChange'];
  };
}
