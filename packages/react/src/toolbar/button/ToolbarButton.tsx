'use client';
import * as React from 'react';
import { EMPTY_OBJECT } from '@base-ui/utils/empty';
import type { NativeButtonComponentProps } from '../../internals/types';
import { useButton } from '../../internals/use-button';
import type { ToolbarRootState } from '../root/ToolbarRoot';
import { useToolbarRootContext } from '../root/ToolbarRootContext';
import { useToolbarGroupContext } from '../group/ToolbarGroupContext';
import { CompositeItem } from '../../internals/composite/item/CompositeItem';

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
    style,
    ...elementProps
  } = componentProps;

  const { disabled: toolbarDisabled, orientation } = useToolbarRootContext();

  const groupContext = useToolbarGroupContext(true);

  const disabled = toolbarDisabled || (groupContext?.disabled ?? false) || disabledProp;

  const itemMetadata = React.useMemo(
    () => ({ disabled, focusableWhenDisabled }),
    [disabled, focusableWhenDisabled],
  );

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    focusableWhenDisabled,
    native: nativeButton,
  });

  const state: ToolbarButtonState = {
    disabled,
    orientation,
    focusable: focusableWhenDisabled,
  };

  return (
    <CompositeItem
      tag="button"
      render={render}
      className={className}
      style={style}
      metadata={itemMetadata}
      state={state}
      refs={[forwardedRef, buttonRef]}
      props={[
        elementProps,
        // When a render prop is provided (typically another Base UI component
        // like Menu.Trigger), forward `disabled` so the rendered component can
        // derive its own disabled state. For the default toolbar button, avoid
        // forwarding a React `disabled` prop so focusable disabled buttons remain
        // hoverable for interactions like tooltips.
        // TODO: follow up after https://github.com/mui/base-ui/issues/1976#issuecomment-2916905663
        render ? { disabled } : EMPTY_OBJECT,
        getButtonProps,
      ]}
    />
  );
}) as unknown as ToolbarButtonComponent;

export interface ToolbarButtonState extends ToolbarRootState {
  /**
   * Whether the component is disabled.
   */
  disabled: boolean;
  /**
   * Whether the component remains focusable when disabled.
   */
  focusable: boolean;
}

export type ToolbarButtonProps<
  TNativeButton extends boolean = true,
  TElement extends React.ElementType = 'button',
> = Omit<NativeButtonComponentProps<TNativeButton, TElement, ToolbarButton.State>, 'disabled'> & {
  /**
   * When `true` the item is disabled.
   * @default false
   */
  disabled?: boolean | undefined;
  /**
   * When `true` the item remains focusable when disabled.
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

type ToolbarButtonComponent = {
  <TElement extends React.ElementType = 'button'>(
    props: ToolbarButton.Props<true, TElement> & { ref?: React.Ref<HTMLButtonElement> | undefined },
  ): React.ReactElement | null;
  <TElement extends React.ElementType = 'button'>(
    props: ToolbarButton.Props<false, TElement> & { nativeButton: false } & {
      ref?: React.Ref<HTMLElement> | undefined;
    },
  ): React.ReactElement | null;
  <TElement extends React.ElementType = 'button'>(
    props: ToolbarButton.Props<boolean, TElement> & { nativeButton: boolean } & {
      ref?: React.Ref<HTMLElement> | undefined;
    },
  ): React.ReactElement | null;
};
