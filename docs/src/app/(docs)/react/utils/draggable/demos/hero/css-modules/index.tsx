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
      <div className={styles.Root}>
        <Draggable.Target
          ref={surfaceRef}
          className={styles.Surface}
          onDraggableDrop={(eventDetails) => {
            const surface = eventDetails.currentTarget.element;
            const point = eventDetails.currentTarget.getSnappedLocalPoint({ anchor: 'source' });
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
          </Draggable.Root>
          {/* @focus-end */}
        </Draggable.Target>
        <fieldset className={styles.Controls}>
          <legend className={styles.Legend}>Move card</legend>
          {[
            { label: 'Left', x: -20, y: 0 },
            { label: 'Right', x: 20, y: 0 },
            { label: 'Up', x: 0, y: -20 },
            { label: 'Down', x: 0, y: 20 },
          ].map((direction) => (
            <button
              key={direction.label}
              type="button"
              className={styles.Button}
              onClick={() => placeCard(position.x + direction.x, position.y + direction.y)}
            >
              {direction.label}
            </button>
          ))}
        </fieldset>
        <p role="status" className={styles.Status}>
          Card position: {Math.round(position.x)}, {Math.round(position.y)}
        </p>
      </div>
    </Draggable.Provider>
  );
}
