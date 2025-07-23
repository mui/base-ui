'use client';
import * as React from 'react';
import { useSelector } from '@base-ui-components/utils/store';
import { InteractionType } from '@base-ui-components/utils/useEnhancedClickHandler';
import { FloatingFocusManager } from '../../floating-ui-react';
import { usePopoverRootContext } from '../root/PopoverRootContext';
import { usePopoverPositionerContext } from '../positioner/PopoverPositionerContext';
import type { Side, Align } from '../../utils/useAnchorPositioning';
import type { BaseUIComponentProps } from '../../utils/types';
import type { CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import type { TransitionStatus } from '../../utils/useTransitionStatus';
import { popupStateMapping as baseMapping } from '../../utils/popupStateMapping';
import { transitionStatusMapping } from '../../utils/styleHookMapping';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';
import { useRenderElement } from '../../utils/useRenderElement';
import { DISABLED_TRANSITIONS_STYLE, EMPTY_OBJECT } from '../../utils/constants';
import { selectors } from '../store';

const customStyleHookMapping: CustomStyleHookMapping<PopoverPopup.State> = {
  ...baseMapping,
  ...transitionStatusMapping,
};

/**
 * A container for the popover contents.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Popover](https://base-ui.com/react/components/popover)
 */
export const PopoverPopup = React.forwardRef(function PopoverPopup(
  componentProps: PopoverPopup.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, initialFocus, finalFocus, ...elementProps } = componentProps;

  const { popupRef, onOpenChangeComplete, store } = usePopoverRootContext();

  const positioner = usePopoverPositionerContext();
  const open = useSelector(store, selectors.open);
  const openMethod = useSelector(store, selectors.openMethod);
  const instantType = useSelector(store, selectors.instantType);
  const transitionStatus = useSelector(store, selectors.transitionStatus);
  const popupProps = useSelector(store, selectors.popupProps);
  const titleId = useSelector(store, selectors.titleId);
  const descriptionId = useSelector(store, selectors.descriptionId);
  const modal = useSelector(store, selectors.modal);
  const mounted = useSelector(store, selectors.mounted);
  const openReason = useSelector(store, selectors.openReason);

  useOpenChangeComplete({
    open,
    ref: popupRef,
    onComplete() {
      if (open) {
        onOpenChangeComplete?.(true);
      }
    },
  });

  const resolvedInitialFocus = React.useMemo(() => {
    if (initialFocus == null) {
      if (openMethod === 'touch') {
        return popupRef;
      }
      return 0;
    }

    if (typeof initialFocus === 'function') {
      return initialFocus(openMethod ?? '');
    }

    return initialFocus;
  }, [initialFocus, openMethod, popupRef]);

  const state: PopoverPopup.State = React.useMemo(
    () => ({
      open,
      side: positioner.side,
      align: positioner.align,
      instant: instantType,
      transitionStatus,
    }),
    [open, positioner.side, positioner.align, instantType, transitionStatus],
  );

  const setPopupElement = React.useCallback(
    (element: HTMLElement | null) => {
      store.set('popupElement', element);
    },
    [store],
  );

  const element = useRenderElement('div', componentProps, {
    state,
    ref: [forwardedRef, popupRef, setPopupElement],
    props: [
      popupProps,
      {
        'aria-labelledby': titleId,
        'aria-describedby': descriptionId,
      },
      transitionStatus === 'starting' ? DISABLED_TRANSITIONS_STYLE : EMPTY_OBJECT,
      elementProps,
    ],
    customStyleHookMapping,
  });

  return (
    <FloatingFocusManager
      context={positioner.context}
      modal={modal === 'trap-focus'}
      disabled={!mounted || openReason === 'trigger-hover'}
      initialFocus={resolvedInitialFocus}
      returnFocus={finalFocus}
      closeOnFocusOut={false}
    >
      {element}
    </FloatingFocusManager>
  );
});

export namespace PopoverPopup {
  export interface State {
    /**
     * Whether the popover is currently open.
     */
    open: boolean;
    side: Side;
    align: Align;
    transitionStatus: TransitionStatus;
  }

  export interface Props extends BaseUIComponentProps<'div', State> {
    /**
     * Determines the element to focus when the popover is opened.
     * By default, the first focusable element is focused.
     */
    initialFocus?:
      | React.RefObject<HTMLElement | null>
      | ((interactionType: InteractionType) => React.RefObject<HTMLElement | null>);
    /**
     * Determines the element to focus when the popover is closed.
     * By default, focus returns to the trigger.
     */
    finalFocus?: React.RefObject<HTMLElement | null>;
  }
}
