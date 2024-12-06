'use client';
import * as React from 'react';
import {
  type FloatingRootContext,
  useFloating,
  type FloatingContext,
  type OpenChangeReason as FloatingUIOpenChangeReason,
} from '@floating-ui/react';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { useForkRef } from '../../utils/useForkRef';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { useScrollLock } from '../../utils/useScrollLock';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect';
import { type InteractionType } from '../../utils/useEnhancedClickHandler';
import { GenericHTMLProps } from '../../utils/types';
import {
  translateOpenChangeReason,
  type OpenChangeReason,
} from '../../utils/translateOpenChangeReason';

export function useDialogPopup(parameters: useDialogPopup.Parameters): useDialogPopup.ReturnValue {
  const {
    descriptionElementId,
    floatingRootContext,
    getPopupProps,
    id: idParam,
    initialFocus,
    modal,
    mounted,
    setOpen,
    open,
    openMethod,
    ref,
    setPopupElementId,
    setPopupElement,
    titleElementId,
  } = parameters;

  const handleFloatingUIOpenChange = React.useCallback(
    (isOpen: boolean, event: Event | undefined, reason: FloatingUIOpenChangeReason | undefined) => {
      setOpen(isOpen, event, translateOpenChangeReason(reason));
    },
    [setOpen],
  );

  const { context, elements } = useFloating({
    open,
    onOpenChange: handleFloatingUIOpenChange,
    rootContext: floatingRootContext,
  });

  const popupRef = React.useRef<HTMLElement>(null);

  const id = useBaseUiId(idParam);
  const handleRef = useForkRef(ref, popupRef, setPopupElement);

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
    mergeReactProps<'div'>(externalProps, {
      'aria-labelledby': titleElementId ?? undefined,
      'aria-describedby': descriptionElementId ?? undefined,
      'aria-modal': open && modal ? true : undefined,
      role: 'dialog',
      tabIndex: -1,
      ...getPopupProps(),
      id,
      ref: handleRef,
      hidden: !mounted,
    });

  return {
    floatingContext: context,
    getRootProps,
    resolvedInitialFocus,
  };
}

export namespace useDialogPopup {
  export interface Parameters {
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
    setOpen: (
      open: boolean,
      event: Event | undefined,
      reason: OpenChangeReason | undefined,
    ) => void;
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
     * Determines an element to focus when the dialog is opened.
     * It can be either a ref to the element or a function that returns such a ref.
     * If not provided, the first focusable element is focused.
     */
    initialFocus?:
      | React.RefObject<HTMLElement | null>
      | ((interactionType: InteractionType) => React.RefObject<HTMLElement | null>);
    /**
     * The Floating UI root context.
     */
    floatingRootContext: FloatingRootContext;
    /**
     * Determines if the dialog should be mounted.
     */
    mounted: boolean;
    /**
     * The resolver for the popup element props.
     */
    getPopupProps: () => GenericHTMLProps;
    /**
     * Callback to register the popup element.
     */
    setPopupElement: React.Dispatch<React.SetStateAction<HTMLElement | null>>;
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
    resolvedInitialFocus: React.RefObject<HTMLElement | null> | number;
  }
}
