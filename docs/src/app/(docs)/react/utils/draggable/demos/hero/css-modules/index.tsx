'use client';
import { Draggable } from '@base-ui/react/draggable';

import * as React from 'react';

import styles from '../../hero.module.css';

export default function DraggableHero() {
  const surfaceRef = React.useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = React.useState({ x: 24, y: 24 });

  return (
    <Draggable.Provider>
      <Draggable.Target
        ref={surfaceRef}
        className={styles.Surface}
        onDraggableDrop={(eventDetails) => {
          const surface = eventDetails.target.element;
          const point = eventDetails.target.getSnappedLocalPoint({ anchor: 'source' });
          const rect = surface.getBoundingClientRect();
          setPosition({
            x: point.x * rect.width - surface.clientLeft,
            y: point.y * rect.height - surface.clientTop,
          });
        }}
      >
        {/* @focus-start @min 8 */}
        {/* @highlight-start */}
        <Draggable.Root
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
    </Draggable.Provider>
  );
}
