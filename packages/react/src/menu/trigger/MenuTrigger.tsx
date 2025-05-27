'use client';
import * as React from 'react';
import { CompositeItem } from '../../composite/item/CompositeItem';
import { useMenuTrigger } from './useMenuTrigger';
import { useMenuRootContext } from '../root/MenuRootContext';
import { pressableTriggerOpenStateMapping } from '../../utils/popupStateMapping';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { BaseUIComponentProps, HTMLProps } from '../../utils/types';
import { mergeProps } from '../../merge-props';

/**
 * A button that opens the menu.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export const MenuTrigger = React.forwardRef(function MenuTrigger(
  props: MenuTrigger.Props,
  forwardedRef: React.ForwardedRef<HTMLElement>,
) {
  const {
    render,
    className,
    disabled: disabledProp = false,
    nativeButton = true,
    ...other
  } = props;

  const {
    triggerProps: rootTriggerProps,
    disabled: menuDisabled,
    setTriggerElement,
    open,
    setOpen,
    allowMouseUpTriggerRef,
    positionerRef,
    parent,
    lastOpenChangeReason,
  } = useMenuRootContext();

  const disabled = disabledProp || menuDisabled;

  const { getTriggerProps } = useMenuTrigger({
    disabled,
    rootRef: forwardedRef,
    setTriggerElement,
    open,
    setOpen,
    allowMouseUpTriggerRef,
    positionerRef,
    menuParent: parent,
    lastOpenChangeReason,
    nativeButton,
  });

  const state: MenuTrigger.State = React.useMemo(
    () => ({
      disabled,
      open,
    }),
    [disabled, open],
  );

  const propGetter = React.useCallback(
    (externalProps: HTMLProps) => mergeProps(rootTriggerProps, externalProps, getTriggerProps),
    [getTriggerProps, rootTriggerProps],
  );

  const { renderElement } = useComponentRenderer({
    render: render || 'button',
    className,
    state,
    propGetter,
    customStyleHookMapping: pressableTriggerOpenStateMapping,
    extraProps: other,
  });

  if (parent.type === 'menubar') {
    return <CompositeItem render={renderElement()} />;
  }

  return renderElement();
});

export namespace MenuTrigger {
  export interface Props extends BaseUIComponentProps<'button', State> {
    children?: React.ReactNode;
    /**
     * Whether the component should ignore user interaction.
     * @default false
     */
    disabled?: boolean;
    /**
     * Determines whether the component is being rendered as a native button.
     * @default true
     */
    nativeButton?: boolean;
  }

  export type State = {
    /**
     * Whether the menu is currently open.
     */
    open: boolean;
  };
}
