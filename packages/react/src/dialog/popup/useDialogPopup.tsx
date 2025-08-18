'use client';
import * as React from 'react';
import { useMergedRefs } from '@base-ui-components/utils/useMergedRefs';
import { type InteractionType } from '@base-ui-components/utils/useEnhancedClickHandler';
import type { DialogRoot } from '../root/DialogRoot';
import { HTMLProps } from '../../utils/types';
import { COMPOSITE_KEYS } from '../../composite/composite';
import { BaseUIEventData } from '../../utils/createBaseUIEvent';

export function useDialogPopup(parameters: useDialogPopup.Parameters): useDialogPopup.ReturnValue {
  const {
    descriptionElementId,
    initialFocus,
    mounted,
    openMethod,
    ref,
    setPopupElement,
    titleElementId,
  } = parameters;

  const popupRef = React.useRef<HTMLElement>(null);

  const handleRef = useMergedRefs(ref, popupRef, setPopupElement);

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

  const popupProps: HTMLProps = {
    'aria-labelledby': titleElementId ?? undefined,
    'aria-describedby': descriptionElementId ?? undefined,
    role: 'dialog',
    tabIndex: -1,
    ref: handleRef,
    hidden: !mounted,
    onKeyDown(event) {
      if (COMPOSITE_KEYS.has(event.key)) {
        event.stopPropagation();
      }
    },
  };

  return {
    popupProps,
    resolvedInitialFocus,
  };
}

export namespace useDialogPopup {
  export interface Parameters {
    /**
     * The ref to the dialog element.
     */
    ref: React.Ref<HTMLElement>;
    openMethod: InteractionType | null;
    /**
     * Event handler called when the dialog is opened or closed.
     */
    setOpen: (
      open: boolean,
      event: Event,
      data: BaseUIEventData<DialogRoot.OpenChangeReason>,
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
     * Callback to register the popup element.
     */
    setPopupElement: React.Dispatch<React.SetStateAction<HTMLElement | null>>;
  }

  export interface ReturnValue {
    popupProps: HTMLProps;
    resolvedInitialFocus: React.RefObject<HTMLElement | null> | number;
  }
}
