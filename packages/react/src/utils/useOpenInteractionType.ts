'use client';
import * as React from 'react';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { InteractionType, useEnhancedClickHandler } from '@base-ui/utils/useEnhancedClickHandler';
import { ownerDocument } from '@base-ui/utils/owner';

/**
 * Determines the interaction type (keyboard, mouse, touch, etc.) that opened the component.
 *
 * @param open The open state of the component.
 */
export function useOpenInteractionType(open: boolean, referenceElement: Element | null) {
  const pointerTypeRef = React.useRef<InteractionType>('');
  const [openMethod, setOpenMethod] = React.useState<InteractionType | null>(null);

  // On iOS Safari, the hitslop around touch targets means tapping outside an element's bounds
  // does not fire `pointerdown` but does fire `mousedown`. We need to track `pointerdown` at
  // the document level to ensure we capture pointer interactions in the hitslop area as
  // `interactionType` is `""` in that case.
  React.useEffect(() => {
    function trackPointerType(event: PointerEvent) {
      pointerTypeRef.current = event.pointerType as React.PointerEvent['pointerType'];
    }

    const doc = ownerDocument(referenceElement);
    doc.addEventListener('pointerdown', trackPointerType, true);
    return () => {
      doc.removeEventListener('pointerdown', trackPointerType, true);
    };
  }, [referenceElement]);

  const handleTriggerClick = useStableCallback(
    (_: React.MouseEvent, interactionType: InteractionType) => {
      if (!open) {
        setOpenMethod(interactionType || pointerTypeRef.current);
      }
    },
  );

  const reset = React.useCallback(() => {
    setOpenMethod(null);
    pointerTypeRef.current = '';
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
