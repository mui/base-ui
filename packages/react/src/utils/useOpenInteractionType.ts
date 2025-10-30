'use client';
import * as React from 'react';
import { useStableCallback } from '@base-ui-components/utils/useStableCallback';
import {
  InteractionType,
  useEnhancedClickHandler,
} from '@base-ui-components/utils/useEnhancedClickHandler';

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

  const reset = React.useCallback(() => {
    setOpenMethod(null);
  }, []);

  const { onClick, onPointerDown } = useEnhancedClickHandler(handleTriggerClick);

  return React.useMemo(
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
