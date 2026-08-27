'use client';
import * as React from 'react';
import { Draggable } from '@base-ui/react/draggable';
import { DropTarget } from '@base-ui/react/drop-target';
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
    <Draggable.Root label="Chart layer" kind={layerKind} role="button" className={styles.Layer}>
      <ChartIcon />
      Chart
    </Draggable.Root>
  );
}

export default function NestedDropTargets() {
  const [location, setLocation] = React.useState<Location>('palette');

  return (
    <div className={styles.Root}>
      <div className={styles.Palette}>{location === 'palette' && <ChartLayer />}</div>
      <DropTarget.Root
        className={styles.Canvas}
        label="Canvas"
        accept={layerKind}
        onDrop={() => setLocation('canvas')}
      >
        <span className={styles.Label}>Canvas</span>
        <div className={styles.CanvasLayers}>{location === 'canvas' && <ChartLayer />}</div>
        <DropTarget.Root
          className={styles.Frame}
          // @highlight-start
          label="Frame"
          accept={layerKind}
          onDrop={() => setLocation('frame')}
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
        </DropTarget.Root>
      </DropTarget.Root>
    </div>
  );
}
