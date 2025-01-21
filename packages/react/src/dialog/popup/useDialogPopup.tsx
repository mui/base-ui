'use client';
import * as React from 'react';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { useForkRef } from '../../utils/useForkRef';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect';
import { type InteractionType } from '../../utils/useEnhancedClickHandler';
import { GenericHTMLProps } from '../../utils/types';
import { type OpenChangeReason } from '../../utils/translateOpenChangeReason';

export function useDialogPopup(parameters: useDialogPopup.Parameters): useDialogPopup.ReturnValue {
  const {
    descriptionElementId,
    getPopupProps,
    id: idParam,
    initialFocus,
    modal,
    mounted,
    openMethod,
    ref,
    setPopupElementId,
    setPopupElement,
    titleElementId,
  } = parameters;

  const popupRef = React.useRef<HTMLElement>(null);

  const id = useBaseUiId(idParam);
  const handleRef = useForkRef(ref, popupRef, setPopupElement);

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
      'aria-modal': mounted && modal ? true : undefined,
      role: 'dialog',
      tabIndex: -1,
      ...getPopupProps(),
      id,
      ref: handleRef,
      hidden: !mounted,
    });

  return {
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
     * Whether the dialog should prevent outside clicks and lock page scroll when open.
     */
    modal: boolean;
    openMethod: InteractionType | null;
    /**
     * Event handler called when the dialog is opened or closed.
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
     * Determines the element to focus when the dialog is opened.
     * By default, the first focusable element is focused.
     */
    initialFocus?:
      | React.RefObject<HTMLElement | null>
      | ((interactionType: InteractionType) => React.RefObject<HTMLElement | null>);
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
     * Resolver for the root element props.
     */
    getRootProps: (
      externalProps: React.ComponentPropsWithRef<'div'>,
    ) => React.ComponentPropsWithRef<'div'>;
    resolvedInitialFocus: React.RefObject<HTMLElement | null> | number;
  }
}
