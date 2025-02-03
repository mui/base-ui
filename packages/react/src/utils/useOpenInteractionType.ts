'use client';

import * as React from 'react';
import { InteractionType, useEnhancedClickHandler } from './useEnhancedClickHandler';

/**
 * Determines the interaction type (keyboard, mouse, touch, etc.) that opened the component.
 *
 * @param open The open state of the component.
 */
export function useOpenInteractionType(open: boolean) {
  const [openMethod, setOpenMethod] = React.useState<InteractionType | null>(null);

  if (!open && openMethod !== null) {
    setOpenMethod(null);
  }

  const handleTriggerClick = React.useCallback(
    (_: React.MouseEvent, interactionType: InteractionType) => {
      if (!open) {
        setOpenMethod(interactionType);
      }
    },
    [open, setOpenMethod],
  );

  const { onClick, onPointerDown } = useEnhancedClickHandler(handleTriggerClick);

  return React.useMemo(
    () => ({
      openMethod,
      triggerProps: {
        onClick,
        onPointerDown,
      },
    }),
    [openMethod, onClick, onPointerDown],
  );
}
