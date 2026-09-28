'use client';
import { Draggable } from '@base-ui/react/draggable';

import * as React from 'react';

import styles from '../../hero.module.css';

export default function DraggableHero() {
  const surfaceRef = React.useRef<HTMLDivElement | null>(null);
  const cardRef = React.useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = React.useState({ x: 24, y: 24 });

  function placeCard(x: number, y: number) {
    const surface = surfaceRef.current;
    const card = cardRef.current;
    if (!surface || !card) {
      return;
    }
    setPosition({
      x: Math.max(0, Math.min(x, surface.clientWidth - card.offsetWidth)),
      y: Math.max(0, Math.min(y, surface.clientHeight - card.offsetHeight)),
    });
  }

  return (
    <Draggable.Provider>
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <Draggable.Target
          ref={surfaceRef}
          className={styles.Surface}
          onDraggableDrop={(eventDetails) => {
            const surface = eventDetails.target.element;
            const point = eventDetails.target.getSnappedLocalPoint({ anchor: 'source' });
            const rect = surface.getBoundingClientRect();
            placeCard(
              point.x * rect.width - surface.clientLeft,
              point.y * rect.height - surface.clientTop,
            );
          }}
        >
          {/* @focus-start @min 8 */}
          {/* @highlight-start */}
          <Draggable.Root
            ref={cardRef}
            modifiers={Draggable.restrictToElement(surfaceRef)}
            // @highlight-end
            className={styles.Card}
            style={{ left: position.x, top: position.y }}
          >
            Drag me
            <Draggable.Preview />
          </Draggable.Root>
          {/* @focus-end */}
        </Draggable.Target>
        <fieldset style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          <legend>Move card</legend>
          {[
            { label: 'Left', x: -20, y: 0 },
            { label: 'Right', x: 20, y: 0 },
            { label: 'Up', x: 0, y: -20 },
            { label: 'Down', x: 0, y: 20 },
          ].map((direction) => (
            <button
              key={direction.label}
              type="button"
              style={{ border: '1px solid', padding: '0.25rem 0.5rem' }}
              onClick={() => placeCard(position.x + direction.x, position.y + direction.y)}
            >
              {direction.label}
            </button>
          ))}
        </fieldset>
        <p role="status">
          Card position: {Math.round(position.x)}, {Math.round(position.y)}
        </p>
      </div>
    </Draggable.Provider>
  );
}
