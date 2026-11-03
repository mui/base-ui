'use client';
import * as React from 'react';

export interface DraggablePositionerContext {
  /** Registers the `Draggable.Preview` element, whose box the positioner places. Stable. */
  previewRef: React.RefCallback<HTMLElement>;
}

/**
 * Set inside a `Draggable.Positioner`. The parts it renders are a picture of the
 * dragged item, so the drag parts inside it skip registering with the engine.
 */
export const DraggablePositionerContext = React.createContext<
  DraggablePositionerContext | undefined
>(undefined);

export function useDraggablePositionerContext(): DraggablePositionerContext {
  const context = React.useContext(DraggablePositionerContext);
  if (context === undefined) {
    throw new Error(
      'Base UI: DraggablePositionerContext is missing. <Draggable.Preview> is rendered outside of ' +
        '<Draggable.Positioner>, so nothing moves it with the pointer. ' +
        'Wrap it in a <Draggable.Positioner> inside its <Draggable.Root>. ' +
        'See https://base-ui.com/react/utils/draggable#preview.',
    );
  }
  return context;
}
