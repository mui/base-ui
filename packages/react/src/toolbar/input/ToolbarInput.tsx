'use client';
import * as React from 'react';
import { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { ARROW_LEFT, ARROW_RIGHT, stopEvent } from '../../composite/composite';
import { CompositeItem } from '../../composite/item/CompositeItem';
import { useButton } from '../../use-button';
import type { ToolbarRoot } from '../root/ToolbarRoot';
import { useToolbarRootContext } from '../root/ToolbarRootContext';
import { useToolbarGroupContext } from '../group/ToolbarGroupContext';

/**
 * A native input element that integrates with Toolbar keyboard navigation.
 * Renders an `<input>` element.
 *
 * Documentation: [Base UI Toolbar](https://base-ui.com/react/components/toolbar)
 */
export const ToolbarInput = React.forwardRef(function ToolbarInput(
  componentProps: ToolbarInput.Props,
  forwardedRef: React.ForwardedRef<HTMLInputElement>,
) {
  const {
    className,
    focusableWhenDisabled = true,
    render,
    disabled: disabledProp = false,
    ...elementProps
  } = componentProps;

  const { disabled: toolbarDisabled, orientation } = useToolbarRootContext();

  const groupContext = useToolbarGroupContext(true);

  const itemMetadata = React.useMemo(() => ({ focusableWhenDisabled }), [focusableWhenDisabled]);

  const disabled = toolbarDisabled || (groupContext?.disabled ?? false) || disabledProp;

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    focusableWhenDisabled,
    type: 'text',
    elementName: 'input',
  });

  const inputProps: React.ComponentPropsWithRef<'input'> = React.useMemo(
    () => ({
      onClick(event) {
        if (disabled) {
          event.preventDefault();
        }
      },
      onKeyDown(event) {
        if (event.key !== ARROW_LEFT && event.key !== ARROW_RIGHT && disabled) {
          stopEvent(event);
        }
      },
      onPointerDown(event) {
        if (disabled) {
          event.preventDefault();
        }
      },
    }),
    [disabled],
  );

  const state: ToolbarInput.State = React.useMemo(
    () => ({
      disabled,
      orientation,
      focusable: focusableWhenDisabled,
    }),
    [disabled, focusableWhenDisabled, orientation],
  );

  const element = useRenderElement('input', componentProps, {
    state,
    ref: [forwardedRef, buttonRef],
    props: [inputProps, elementProps, getButtonProps],
  });

  return <CompositeItem<ToolbarRoot.ItemMetadata> metadata={itemMetadata} render={element} />;
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
