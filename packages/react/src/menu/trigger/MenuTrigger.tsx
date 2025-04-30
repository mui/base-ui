'use client';
import * as React from 'react';
import { CompositeItem } from '../../composite/item/CompositeItem';
import { useMenuTrigger } from './useMenuTrigger';
import { useMenuRootContext } from '../root/MenuRootContext';
import { pressableTriggerOpenStateMapping } from '../../utils/popupStateMapping';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { BaseUIComponentProps, GenericHTMLProps } from '../../utils/types';
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
  const { render, className, disabled: disabledProp = false, ...other } = props;

  const {
    triggerProps: rootTriggerProps,
    disabled: menuDisabled,
    setTriggerElement,
    open,
    setOpen,
    allowMouseUpTriggerRef,
    positionerRef,
    parent,
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
  });

  const state: MenuTrigger.State = React.useMemo(
    () => ({
      disabled,
      open,
    }),
    [disabled, open],
  );

  const propGetter = React.useCallback(
    (externalProps: GenericHTMLProps) =>
      mergeProps(rootTriggerProps, externalProps, getTriggerProps),
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
  }

  export type State = {
    /**
     * Whether the menu is currently open.
     */
    open: boolean;
  };
}
