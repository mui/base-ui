'use client';
import * as React from 'react';
import { NativeButtonComponentProps } from '../../utils/types';
import { useButton } from '../../use-button';
import type { ToolbarRoot } from '../root/ToolbarRoot';
import { useToolbarRootContext } from '../root/ToolbarRootContext';
import { useToolbarGroupContext } from '../group/ToolbarGroupContext';
import { CompositeItem } from '../../composite/item/CompositeItem';

/**
 * A button that can be used as-is or as a trigger for other components.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Toolbar](https://base-ui.com/react/components/toolbar)
 */
export const ToolbarButton = React.forwardRef(function ToolbarButton(
  componentProps: ToolbarButton.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const {
    className,
    disabled: disabledProp = false,
    focusableWhenDisabled = true,
    render,
    nativeButton = true,
    ...elementProps
  } = componentProps;

  const itemMetadata = React.useMemo(() => ({ focusableWhenDisabled }), [focusableWhenDisabled]);

  const { disabled: toolbarDisabled, orientation } = useToolbarRootContext();

  const groupContext = useToolbarGroupContext(true);

  const disabled = toolbarDisabled || (groupContext?.disabled ?? false) || disabledProp;

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    focusableWhenDisabled,
    native: nativeButton,
  });

  const state: ToolbarButton.State = {
    disabled,
    orientation,
    focusable: focusableWhenDisabled,
  };

  return (
    <CompositeItem
      tag="button"
      render={render}
      className={className}
      metadata={itemMetadata}
      state={state}
      refs={[forwardedRef, buttonRef]}
      props={[
        elementProps,
        // for integrating with Menu and Select disabled states, `disabled` is
        // intentionally duplicated even though getButtonProps includes it already
        // TODO: follow up after https://github.com/mui/base-ui/issues/1976#issuecomment-2916905663
        { disabled },
        getButtonProps,
      ]}
    />
  );
}) as ToolbarButtonComponent;

export interface ToolbarButtonState extends ToolbarRoot.State {
  disabled: boolean;
  focusable: boolean;
}

export type ToolbarButtonProps<
  TNativeButton extends boolean,
  TElement extends React.ElementType,
> = NativeButtonComponentProps<TNativeButton, TElement, ToolbarButton.State> & {
  /**
   * When `true` the item is disabled.
   * @default false
   */
  disabled?: boolean | undefined;
  /**
   * When `true` the item remains focuseable when disabled.
   * @default true
   */
  focusableWhenDisabled?: boolean | undefined;
};

export namespace ToolbarButton {
  export type State = ToolbarButtonState;
  export type Props<
    TNativeButton extends boolean = true,
    TElement extends React.ElementType = 'button',
  > = ToolbarButtonProps<TNativeButton, TElement>;
}

type ToolbarButtonComponent = <
  TNativeButton extends boolean = true,
  TElement extends React.ElementType = 'button',
>(
  props: ToolbarButton.Props<TNativeButton, TElement> & {
    ref?: React.Ref<HTMLButtonElement> | undefined;
  },
) => React.ReactElement | null;
