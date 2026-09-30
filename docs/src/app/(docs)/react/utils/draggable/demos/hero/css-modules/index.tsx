'use client';
import { Draggable } from '@base-ui/react/draggable';

import * as React from 'react';
import { visuallyHidden } from '@base-ui/utils/visuallyHidden';

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
            tabIndex={0}
            aria-keyshortcuts="Alt+ArrowLeft Alt+ArrowRight Alt+ArrowUp Alt+ArrowDown"
            onKeyDown={(event) => {
              if (!event.altKey) {
                return;
              }
              const direction = [
                { key: 'ArrowLeft', x: -20, y: 0 },
                { key: 'ArrowRight', x: 20, y: 0 },
                { key: 'ArrowUp', x: 0, y: -20 },
                { key: 'ArrowDown', x: 0, y: 20 },
              ].find((entry) => entry.key === event.key);
              if (direction) {
                event.preventDefault();
                placeCard(position.x + direction.x, position.y + direction.y);
              }
            }}
          >
            Drag me
          </Draggable.Root>
          {/* @focus-end */}
        </Draggable.Target>
        <p role="status" style={visuallyHidden}>
          Card position: {Math.round(position.x)}, {Math.round(position.y)}
        </p>
      </div>
    </Draggable.Provider>
  );
}
