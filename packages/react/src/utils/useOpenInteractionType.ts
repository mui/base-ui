'use client';
import * as React from 'react';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { InteractionType, useEnhancedClickHandler } from '@base-ui/utils/useEnhancedClickHandler';
import { useCallback } from '@base-ui/utils/useCallback';
import { useMemo } from '@base-ui/utils/useMemo';

/**
 * Determines the interaction type (keyboard, mouse, touch, etc.) that opened the component.
 *
 * @param open The open state of the component.
 */
export function useOpenInteractionType(open: boolean) {
  const [openMethod, setOpenMethod] = React.useState<InteractionType | null>(null);

  const handleTriggerClick = useStableCallback(
    (_: React.MouseEvent, interactionType: InteractionType) => {
      if (!open) {
        setOpenMethod(interactionType);
      }
    },
  );

  const reset = useCallback(() => {
    setOpenMethod(null);
  }, []);

  const { onClick, onPointerDown } = useEnhancedClickHandler(handleTriggerClick);

  return useMemo(
    () => ({
      openMethod,
      reset,
      triggerProps: {
        onClick,
        onPointerDown,
      },
    }),
    [openMethod, reset, onClick, onPointerDown],
  );
}
