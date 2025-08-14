'use client';
import * as React from 'react';
import { ComboboxRoot as ComboboxRootInternal } from './ComboboxRoot';

/**
 * Groups all parts of the component.
 * Doesn't render its own HTML element.
 */
export function ComboboxRoot<Item = any, Multiple extends boolean | undefined = false>(
  props: ComboboxRoot.Props<Item, Multiple>,
): React.JSX.Element {
  const { multiple = false as Multiple, ...rest } = props;

  type Mode = ModeFromMultiple<Multiple>;
  const mode = multiple ? 'multiple' : 'single';
  return <ComboboxRootInternal<Item, Mode> {...(rest as any)} selectionMode={mode} />;
}

type ModeFromMultiple<Multiple extends boolean | undefined> = Multiple extends true
  ? 'multiple'
  : 'single';

export namespace ComboboxRoot {
  export type Props<Item, Multiple extends boolean | undefined = false> = Omit<
    ComboboxRootInternal.Props<Item, ModeFromMultiple<Multiple>>,
    'selectionMode' | 'clearInputOnCloseComplete'
  > & {
    /**
     * Whether multiple items can be selected.
     * @default false
     */
    multiple?: Multiple;
  };
}
