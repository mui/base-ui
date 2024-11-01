'use client';
import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { InteractionType, useEnhancedClickHandler } from '../../utils/useEnhancedClickHandler';

export function useDialogTrigger(
  params: useDialogTrigger.Parameters,
): useDialogTrigger.ReturnValue {
  const { open, onOpenChange, popupElementId, onTriggerClick } = params;

  const handleClick = React.useCallback(
    (event: React.MouseEvent, interactionType: InteractionType) => {
      if (!open) {
        onTriggerClick?.(event, interactionType);
        onOpenChange?.(true, event.nativeEvent);
      }
    },
    [open, onOpenChange, onTriggerClick],
  );

  const { onClick, onPointerDown } = useEnhancedClickHandler(handleClick);

  const getRootProps = React.useCallback(
    (externalProps: React.HTMLAttributes<any> = {}) =>
      mergeReactProps(externalProps, {
        onPointerDown,
        onClick,
        'aria-haspopup': 'dialog',
        'aria-controls': popupElementId ?? undefined,
      }),
    [popupElementId, onClick, onPointerDown],
  );

  return React.useMemo(
    () => ({
      getRootProps,
    }),
    [getRootProps],
  );
}

namespace useDialogTrigger {
  export interface Parameters {
    /**
     * Determines if the dialog is open.
     */
    open: boolean;
    /**
     * Callback to fire when the dialog is requested to be opened or closed.
     */
    onOpenChange: (open: boolean, event: Event) => void;
    onTriggerClick?: (
      event: React.MouseEvent | React.PointerEvent,
      interactionType: InteractionType,
    ) => void;
    /**
     * The id of the popup element.
     */
    popupElementId: string | undefined;
  }

  export interface ReturnValue {
    /**
     * Resolver for the root element props.
     */
    getRootProps: (externalProps?: React.HTMLAttributes<any>) => React.HTMLAttributes<any>;
  }
}
