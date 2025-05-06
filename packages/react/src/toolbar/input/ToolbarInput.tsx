'use client';
import * as React from 'react';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { BaseUIComponentProps } from '../../utils/types';
import { CompositeItem } from '../../composite/item/CompositeItem';
import type { ToolbarRoot, ToolbarItemMetadata } from '../root/ToolbarRoot';
import { useToolbarRootContext } from '../root/ToolbarRootContext';
import { useToolbarGroupContext } from '../group/ToolbarGroupContext';
import { useToolbarInput } from './useToolbarInput';

/**
 * A native input element that integrates with Toolbar keyboard navigation.
 * Renders an `<input>` element.
 *
 * Documentation: [Base UI Toolbar](https://base-ui.com/react/components/toolbar)
 */
export const ToolbarInput = React.forwardRef(function ToolbarInput(
  props: ToolbarInput.Props,
  forwardedRef: React.ForwardedRef<HTMLInputElement>,
) {
  const {
    className,
    focusableWhenDisabled = true,
    render,
    disabled: disabledProp = false,
    ...otherProps
  } = props;

  const { disabled: toolbarDisabled, orientation } = useToolbarRootContext();

  const groupContext = useToolbarGroupContext(true);

  const itemMetadata = React.useMemo(() => ({ focusableWhenDisabled }), [focusableWhenDisabled]);

  const disabled = toolbarDisabled || (groupContext?.disabled ?? false) || disabledProp;

  const { getInputProps } = useToolbarInput({
    ref: forwardedRef,
    disabled,
    focusableWhenDisabled,
  });

  const state: ToolbarInput.State = React.useMemo(
    () => ({
      disabled,
      orientation,
      focusable: focusableWhenDisabled,
    }),
    [disabled, focusableWhenDisabled, orientation],
  );

  const { renderElement } = useComponentRenderer({
    propGetter: getInputProps,
    render: render ?? 'input',
    state,
    className,
    extraProps: otherProps,
  });

  return <CompositeItem<ToolbarItemMetadata> metadata={itemMetadata} render={renderElement()} />;
});

export namespace ToolbarInput {
  export interface State extends ToolbarRoot.State {
    disabled: boolean;
    focusable: boolean;
  }

  export interface Props extends BaseUIComponentProps<'input', ToolbarRoot.State> {
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
    defaultValue?: React.ComponentProps<'input'>['defaultValue'];
  }
}
