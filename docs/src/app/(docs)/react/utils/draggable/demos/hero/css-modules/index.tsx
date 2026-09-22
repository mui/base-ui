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
        onDraggableDrop={({ target }) => {
          const point = target.getSnappedLocalPoint({ anchor: 'source' });
          const rect = target.element.getBoundingClientRect();
          setPosition({
            x: point.x * rect.width - target.element.clientLeft,
            y: point.y * rect.height - target.element.clientTop,
          });
        }}
      >
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
      </Draggable.Target>
    </Draggable.Provider>
  );
}
