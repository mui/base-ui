'use client';
import * as React from 'react';
import { getParentNode, isHTMLElement, isLastTraversableNode } from '@floating-ui/utils/dom';
import { useForkRef } from '@base-ui-components/utils/useForkRef';
import { useTimeout } from '@base-ui-components/utils/useTimeout';
import { ownerDocument } from '@base-ui-components/utils/owner';
import { useEventCallback } from '@base-ui-components/utils/useEventCallback';
import { contains } from '../../floating-ui-react/utils';
import { useFloatingTree } from '../../floating-ui-react/index';
import { useMenuRootContext } from '../root/MenuRootContext';
import { pressableTriggerOpenStateMapping } from '../../utils/popupStateMapping';
import { useRenderElement } from '../../utils/useRenderElement';
import { BaseUIComponentProps, HTMLProps } from '../../utils/types';
import { mergeProps } from '../../merge-props';
import { useButton } from '../../use-button/useButton';
import { getPseudoElementBounds } from '../../utils/getPseudoElementBounds';
import { CompositeItem } from '../../composite/item/CompositeItem';

const BOUNDARY_OFFSET = 2;

/**
 * A button that opens the menu.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export const MenuTrigger = React.forwardRef(function MenuTrigger(
  componentProps: MenuTrigger.Props,
  forwardedRef: React.ForwardedRef<HTMLElement>,
) {
  const {
    render,
    className,
    disabled: disabledProp = false,
    nativeButton = true,
    ...elementProps
  } = componentProps;

  const {
    triggerProps: rootTriggerProps,
    disabled: menuDisabled,
    setTriggerElement,
    open,
    allowMouseUpTriggerRef,
    positionerRef,
    parent,
    lastOpenChangeReason,
    rootId,
  } = useMenuRootContext();

  const disabled = disabledProp || menuDisabled;

  const triggerRef = React.useRef<HTMLElement | null>(null);
  const allowMouseUpTriggerTimeout = useTimeout();

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    native: nativeButton,
  });

  const handleRef = useForkRef(buttonRef, setTriggerElement);
  const { events: menuEvents } = useFloatingTree()!;

  React.useEffect(() => {
    if (!open && parent.type === undefined) {
      allowMouseUpTriggerRef.current = false;
    }
  }, [allowMouseUpTriggerRef, open, parent.type]);

  const handleDocumentMouseUp = useEventCallback((mouseEvent: MouseEvent) => {
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

    if (mouseUpTarget != null && findRootOwnerId(mouseUpTarget) === rootId) {
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

    menuEvents.emit('close', { domEvent: mouseEvent, reason: 'cancel-open' });
  });

  React.useEffect(() => {
    if (open && lastOpenChangeReason === 'trigger-hover') {
      const doc = ownerDocument(triggerRef.current);
      doc.addEventListener('mouseup', handleDocumentMouseUp, { once: true });
    }
  }, [open, handleDocumentMouseUp, lastOpenChangeReason]);

  const isMenubar = parent.type === 'menubar';

  const getTriggerProps = React.useCallback(
    (externalProps?: HTMLProps): HTMLProps => {
      return mergeProps(
        {
          role: isMenubar ? 'menuitem' : undefined,
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
            doc.addEventListener('mouseup', handleDocumentMouseUp, { once: true });
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
      handleDocumentMouseUp,
      isMenubar,
    ],
  );

  const state: MenuTrigger.State = React.useMemo(
    () => ({
      disabled,
      open,
    }),
    [disabled, open],
  );

  const ref = [triggerRef, forwardedRef, buttonRef];
  const props = [rootTriggerProps, elementProps, getTriggerProps];

  const element = useRenderElement('button', componentProps, {
    enabled: !isMenubar,
    customStyleHookMapping: pressableTriggerOpenStateMapping,
    state,
    ref,
    props,
  });

  if (isMenubar) {
    return (
      <CompositeItem
        tag="button"
        render={render}
        className={className}
        state={state}
        refs={ref}
        props={props}
        customStyleHookMapping={pressableTriggerOpenStateMapping}
      />
    );
  }

  return element;
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
     * Whether the component renders a native `<button>` element when replacing it
     * via the `render` prop.
     * Set to `false` if the rendered element is not a button (e.g. `<div>`).
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

function findRootOwnerId(node: Node): string | undefined {
  if (isHTMLElement(node) && node.hasAttribute('data-rootownerid')) {
    return node.getAttribute('data-rootownerid') ?? undefined;
  }

  if (isLastTraversableNode(node)) {
    return undefined;
  }

  return findRootOwnerId(getParentNode(node));
}
