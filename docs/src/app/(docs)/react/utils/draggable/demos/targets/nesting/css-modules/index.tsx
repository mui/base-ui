'use client';
import { Draggable } from '@base-ui/react/draggable';

import * as React from 'react';

import styles from '../../nesting.module.css';

type Location = 'palette' | 'canvas' | 'frame';

const layerKind = Draggable.createKind('drop-target/nested-layer');

function ChartIcon() {
  return (
    <svg className={styles.ChartIcon} width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M2.5 13.5h11" fill="none" stroke="currentColor" />
      <rect x="3" y="8" width="2.25" height="4" fill="currentColor" />
      <rect x="6.875" y="5" width="2.25" height="7" fill="currentColor" />
      <rect x="10.75" y="2.5" width="2.25" height="9.5" fill="currentColor" />
    </svg>
  );
}

function ChartLayer() {
  return (
    <Draggable.Root kind={layerKind} role="button" className={styles.Layer}>
      <ChartIcon />
      Chart
    </Draggable.Root>
  );
}

function NestedDropTargetsContent() {
  const [location, setLocation] = React.useState<Location>('palette');

  return (
    <div className={styles.Root}>
      <div className={styles.Palette}>{location === 'palette' && <ChartLayer />}</div>
      <Draggable.Target
        className={styles.Canvas}
        accept={layerKind}
        onDraggableDrop={() => setLocation('canvas')}
      >
        <span className={styles.Label}>Canvas</span>
        <div className={styles.CanvasLayers}>{location === 'canvas' && <ChartLayer />}</div>
        <Draggable.Target
          className={styles.Frame}
          // @highlight-start

          accept={layerKind}
          onDraggableDrop={() => setLocation('frame')}
          // @highlight-end
        >
          <span className={styles.Label}>Frame</span>
          <div className={styles.FrameLayers}>
            {location === 'frame' ? (
              <ChartLayer />
            ) : (
              <span className={styles.Empty}>Drop into frame</span>
            )}
          </div>
        </Draggable.Target>
      </Draggable.Target>
    </div>
  );
}

export default function NestedDropTargets() {
  return (
    <Draggable.Provider>
      <NestedDropTargetsContent />
    </Draggable.Provider>
  );
}
