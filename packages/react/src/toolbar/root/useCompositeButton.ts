'use client';
import * as React from 'react';
// import { GenericHTMLProps } from '../../utils/types';
// import { mergeReactProps } from '../utils/mergeReactProps';
import { useToolbarRootContext, type ToolbarRootContext } from './ToolbarRootContext';
import type { ToolbarItemMetadata } from './ToolbarRoot';

function useCompositeButton(parameters: useCompositeButton.Parameters) {
  const { disabled: disabledParam, focusableWhenDisabled } = parameters;

  const toolbarContext = useToolbarRootContext(true);

  const itemMetadata = React.useMemo(
    () => ({ focusableWhenDisabled: focusableWhenDisabled || toolbarContext !== undefined }),
    [focusableWhenDisabled, toolbarContext],
  );

  const disabled = (toolbarContext?.disabled ?? false) || (disabledParam ?? false);

  return {
    toolbarContext,
    disabled,
    itemMetadata,
  };
}

namespace useCompositeButton {
  export interface Parameters {
    /**
     * When `true` the item is disabled.
     * @default false
     */
    disabled?: boolean;
    /**
     * When `true` the item remains focuseable when disabled.
     * @default true
     */
    focusableWhenDisabled?: boolean;
  }

  export interface ReturnValue {
    toolbarContext: ToolbarRootContext | undefined;
    disabled: boolean;
    itemMetadata: ToolbarItemMetadata;
  }
}

export { useCompositeButton };
