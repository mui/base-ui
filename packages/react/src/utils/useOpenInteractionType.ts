'use client';
import * as React from 'react';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { InteractionType, useEnhancedClickHandler } from '@base-ui/utils/useEnhancedClickHandler';
import { isIOS } from '@base-ui/utils/detectBrowser';
import { useValueChanged } from '../internals/useValueChanged';

function normalizeInteractionType(interactionType: InteractionType) {
  return (
    interactionType ||
    // On iOS Safari, the hitslop around touch targets means tapping outside an element's
    // bounds does not fire `pointerdown` but does fire `mousedown`.
    // The `interactionType` will be '' in that case.
    (isIOS ? 'touch' : '')
  );
}

export function useOpenMethodTriggerProps(
  open: boolean,
  onOpenMethodChange: (interactionType: InteractionType) => void,
) {
  const handleTriggerClick = useStableCallback(
    (_event: React.MouseEvent | React.PointerEvent, interactionType: InteractionType) => {
      if (!open) {
        onOpenMethodChange(normalizeInteractionType(interactionType));
      }
    },
  );

  return useEnhancedClickHandler(handleTriggerClick);
}

/**
 * Determines the interaction type (keyboard, mouse, touch, etc.) that opened the component.
 *
 * @param open The open state of the component.
 */
export function useOpenInteractionType(open: boolean) {
  const [openMethod, setOpenMethod] = React.useState<InteractionType | null>(null);

  useValueChanged(open, (previousOpen) => {
    if (previousOpen && !open) {
      setOpenMethod(null);
    }
  });

  const { onClick, onPointerDown } = useOpenMethodTriggerProps(open, setOpenMethod);

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
