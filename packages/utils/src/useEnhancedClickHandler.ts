'use client';
import * as React from 'react';
import { isVirtualPointerEvent } from './isVirtualPointerEvent';

export type InteractionType = 'mouse' | 'touch' | 'pen' | 'keyboard' | '';
export type OpenInteractionType = InteractionType | 'virtual';

/**
 * Provides a cross-browser way to determine the type of the pointer used to click.
 * Safari and Firefox do not provide the PointerEvent to the click handler (they use MouseEvent) yet.
 * Additionally, this implementation detects if the click was triggered by the keyboard.
 *
 * @param handler The function to be called when the button is clicked. The first parameter is the original event and the second parameter is the pointer type.
 */
export function useEnhancedClickHandler(
  handler: (
    event: React.MouseEvent | React.PointerEvent,
    interactionType: OpenInteractionType,
  ) => void,
) {
  const lastClickInteractionTypeRef = React.useRef<OpenInteractionType>('');

  const handlePointerDown = React.useCallback(
    (event: React.PointerEvent) => {
      if (event.defaultPrevented) {
        return;
      }

      const interactionType = isVirtualPointerEvent(event.nativeEvent)
        ? 'virtual'
        : (event.pointerType as InteractionType);
      lastClickInteractionTypeRef.current = interactionType;
      handler(event, interactionType);
    },
    [handler],
  );

  const handleClick = React.useCallback(
    (event: React.MouseEvent | React.PointerEvent) => {
      if (lastClickInteractionTypeRef.current === 'virtual') {
        handler(event, 'virtual');
        lastClickInteractionTypeRef.current = '';
        return;
      }

      // event.detail has the number of clicks performed on the element. 0 means it was triggered by the keyboard.
      if (event.detail === 0) {
        handler(event, 'keyboard');
        return;
      }

      if ('pointerType' in event) {
        // Chrome and Edge correctly use PointerEvent
        handler(event, event.pointerType);
      } else {
        handler(event, lastClickInteractionTypeRef.current);
      }
      lastClickInteractionTypeRef.current = '';
    },
    [handler],
  );

  return { onClick: handleClick, onPointerDown: handlePointerDown };
}
