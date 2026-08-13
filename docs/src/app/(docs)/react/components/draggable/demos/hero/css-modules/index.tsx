'use client';
import * as React from 'react';
import { Draggable } from '@base-ui/react/draggable';
import { DropTarget } from '@base-ui/react/drop-target';
import styles from '../../hero.module.css';

const cardKind = Draggable.createKind('card');
const CARD_WIDTH = 128;
const CARD_HEIGHT = 40;

export default function DraggableHero() {
  const surfaceRef = React.useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = React.useState({ x: 24, y: 24 });

  return (
    <div className={styles.Root}>
      {/* The surface is the drop target, so a release on it reaches `onDrop`. */}
      <DropTarget.Root
        ref={surfaceRef}
        label="Canvas"
        accept={cardKind}
        trackOver={false}
        className={styles.Surface}
        onDrop={({ self }) => {
          const surface = surfaceRef.current;
          if (!surface) {
            return;
          }

          // No snap steps are declared, so this is the exact source-anchored point.
          const point = self.getSnappedLocalPoint({ anchor: 'source' });
          const surfaceRect = surface.getBoundingClientRect();
          setPosition({
            x: point.x * surfaceRect.width - surface.clientLeft,
            y: point.y * surfaceRect.height - surface.clientTop,
          });
        }}
      >
        <Draggable.Root
          label="Drag me"
          kind={cardKind}
          modifiers={Draggable.restrictToElement(surfaceRef)}
          role="button"
          className={styles.Card}
          style={{ left: position.x, top: position.y, width: CARD_WIDTH, height: CARD_HEIGHT }}
        >
          Drag me
          <Draggable.ClonedPreview />
        </Draggable.Root>
      </DropTarget.Root>
    </div>
  );
}
