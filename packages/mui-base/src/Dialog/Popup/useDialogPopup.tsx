'use client';
import * as React from 'react';
import { useFloating, useInteractions, useDismiss, type FloatingContext } from '@floating-ui/react';
import { useId } from '../../utils/useId';
import { useForkRef } from '../../utils/useForkRef';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { useAnimatedElement } from '../../utils/useAnimatedElement';
import { useScrollLock } from '../../utils/useScrollLock';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect';
import { type TransitionStatus } from '../../utils/useTransitionStatus';
import { type InteractionType } from '../../utils/useEnhancedClickHandler';

export function useDialogPopup(parameters: useDialogPopup.Parameters): useDialogPopup.ReturnValue {
  const {
    animated,
    descriptionElementId,
    id: idParam,
    modal,
    onOpenChange,
    open,
    ref,
    setPopupElementId,
    dismissible,
    titleElementId,
    isTopmost,
    initialFocus,
    openMethod,
  } = parameters;

  const { refs, context, elements } = useFloating({
    open,
    onOpenChange,
  });

  const popupRef = React.useRef<HTMLElement>(null);

  const dismiss = useDismiss(context, {
    outsidePressEvent: 'mousedown',
    outsidePress: isTopmost && dismissible,
    escapeKey: isTopmost,
  });
  const { getFloatingProps } = useInteractions([dismiss]);

  const id = useId(idParam);
  const handleRef = useForkRef(ref, popupRef, refs.setFloating);

  const { mounted, transitionStatus } = useAnimatedElement({
    open,
    ref: popupRef,
    enabled: animated,
  });

  useScrollLock(modal && mounted, elements.floating);

  // Default initial focus logic:
  // If opened by touch, focus the popup element to prevent the virtual keyboard from opening
  // (this is required for Android specifically as iOS handles this automatically).
  const defaultInitialFocus = React.useCallback((interactionType: InteractionType) => {
    if (interactionType === 'touch') {
      return popupRef;
    }

    return 0;
  }, []);

  const resolvedInitialFocus = React.useMemo(() => {
    if (initialFocus == null) {
      return defaultInitialFocus(openMethod ?? '');
    }

    if (typeof initialFocus === 'function') {
      return initialFocus(openMethod ?? '');
    }

    return initialFocus;
  }, [defaultInitialFocus, initialFocus, openMethod]);

  useEnhancedEffect(() => {
    setPopupElementId(id);
    return () => {
      setPopupElementId(undefined);
    };
  }, [id, setPopupElementId]);

  const getRootProps = (externalProps: React.HTMLAttributes<any>) =>
    mergeReactProps(externalProps, {
      'aria-labelledby': titleElementId ?? undefined,
      'aria-describedby': descriptionElementId ?? undefined,
      'aria-hidden': !open || undefined,
      'aria-modal': open && modal ? true : undefined,
      role: 'dialog',
      tabIndex: -1,
      ...getFloatingProps(),
      id,
      ref: handleRef,
    });

  return {
    floatingContext: context,
    getRootProps,
    mounted,
    transitionStatus,
    resolvedInitialFocus,
  };
}

export namespace useDialogPopup {
  export interface Parameters {
    /**
     * If `true`, the dialog supports CSS-based animations and transitions.
     * It is kept in the DOM until the animation completes.
     */
    animated: boolean;
    /**
     * The id of the dialog element.
     */
    id?: string;
    /**
     * The ref to the dialog element.
     */
    ref: React.Ref<HTMLElement>;
    /**
     * Determines if the dialog is modal.
     */
    modal: boolean;
    /**
     * Determines if the dialog is open.
     */
    open: boolean;
    openMethod: InteractionType | null;
    /**
     * Callback fired when the dialog is requested to be opened or closed.
     */
    onOpenChange: (open: boolean, event?: Event) => void;
    /**
     * The id of the title element associated with the dialog.
     */
    titleElementId: string | undefined;
    /**
     * The id of the description element associated with the dialog.
     */
    descriptionElementId: string | undefined;
    /**
     * Callback to set the id of the popup element.
     */
    setPopupElementId: (id: string | undefined) => void;
    /**
     * Determines whether the dialog should close when clicking outside of it.
     * @default true
     */
    dismissible?: boolean;
    /**
     * Determines if the dialog is the top-most one.
     */
    isTopmost: boolean;
    /**
     * Determines an element to focus when the dialog is opened.
     * It can be either a ref to the element or a function that returns such a ref.
     * If not provided, the first focusable element is focused.
     */
    initialFocus?:
      | React.RefObject<HTMLElement | null>
      | ((interactionType: InteractionType) => React.RefObject<HTMLElement | null>);
  }

  export interface ReturnValue {
    /**
     * Floating UI context for the dialog's FloatingFocusManager.
     */
    floatingContext: FloatingContext;
    /**
     * Resolver for the root element props.
     */
    getRootProps: (
      externalProps: React.ComponentPropsWithRef<'div'>,
    ) => React.ComponentPropsWithRef<'div'>;
    /**
     * Determines if the dialog should be mounted even if closed (as the exit animation is still in progress).
     */
    mounted: boolean;
    /**
     * The current transition status of the dialog.
     */
    transitionStatus: TransitionStatus;
    resolvedInitialFocus: React.RefObject<HTMLElement | null> | number;
  }
}
