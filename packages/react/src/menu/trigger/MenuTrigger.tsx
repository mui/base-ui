'use client';
import * as React from 'react';
import { contains } from '../../floating-ui-react/utils';
import { CompositeItem } from '../../composite/item/CompositeItem';
import { useMenuRootContext } from '../root/MenuRootContext';
import { pressableTriggerOpenStateMapping } from '../../utils/popupStateMapping';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { BaseUIComponentProps, HTMLProps } from '../../utils/types';
import { useForkRef } from '../../utils/useForkRef';
import { mergeProps } from '../../merge-props';
import { useButton } from '../../use-button/useButton';
import { useTimeout } from '../../utils/useTimeout';
import { ownerDocument } from '../../utils/owner';
import { getPseudoElementBounds } from '../../utils/getPseudoElementBounds';
import { useEventCallback } from '../../utils/useEventCallback';

const BOUNDARY_OFFSET = 2;

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
    lastOpenChangeReason,
  } = useMenuRootContext();

  const disabled = disabledProp || menuDisabled;

  const triggerRef = React.useRef<HTMLElement | null>(null);
  const mergedRef = useForkRef(forwardedRef, triggerRef);
  const allowMouseUpTriggerTimeout = useTimeout();

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    buttonRef: mergedRef,
  });

  const handleRef = useForkRef(buttonRef, setTriggerElement);

  React.useEffect(() => {
    if (!open && parent.type === undefined) {
      allowMouseUpTriggerRef.current = false;
    }
  }, [allowMouseUpTriggerRef, open, parent.type]);

  const handleMouseUp = useEventCallback((mouseEvent: MouseEvent) => {
    if (!triggerRef.current) {
      return;
    }

    allowMouseUpTriggerTimeout.clear();
    allowMouseUpTriggerRef.current = false;

    const mouseUpTarget = mouseEvent.target as Element | null;

    if (
      contains(triggerRef.current, mouseUpTarget) ||
      contains(positionerRef.current, mouseUpTarget) ||
      mouseUpTarget === triggerRef.current
    ) {
      return;
    }

    const bounds = getPseudoElementBounds(triggerRef.current);

    if (
      mouseEvent.clientX >= bounds.left - BOUNDARY_OFFSET &&
      mouseEvent.clientX <= bounds.right + BOUNDARY_OFFSET &&
      mouseEvent.clientY >= bounds.top - BOUNDARY_OFFSET &&
      mouseEvent.clientY <= bounds.bottom + BOUNDARY_OFFSET
    ) {
      return;
    }

    setOpen(false, mouseEvent, 'cancel-open');
  });

  React.useEffect(() => {
    if (open && lastOpenChangeReason === 'trigger-hover') {
      const doc = ownerDocument(triggerRef.current);
      doc.addEventListener('mouseup', handleMouseUp, { once: true });
    }
  }, [open, handleMouseUp, lastOpenChangeReason]);

  const getTriggerProps = React.useCallback(
    (externalProps?: HTMLProps): HTMLProps => {
      return mergeProps(
        {
          'aria-haspopup': 'menu' as const,
          ref: handleRef,
          onMouseDown: (event: React.MouseEvent) => {
            if (open) {
              return;
            }

            // mousedown -> mouseup on menu item should not trigger it within 200ms.
            allowMouseUpTriggerTimeout.start(200, () => {
              allowMouseUpTriggerRef.current = true;
            });

            const doc = ownerDocument(event.currentTarget);
            doc.addEventListener('mouseup', handleMouseUp, { once: true });
          },
        },
        externalProps,
        getButtonProps,
      );
    },
    [
      getButtonProps,
      handleRef,
      open,
      allowMouseUpTriggerRef,
      allowMouseUpTriggerTimeout,
      handleMouseUp,
    ],
  );

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
  }

  export type State = {
    /**
     * Whether the menu is currently open.
     */
    open: boolean;
  };
}
