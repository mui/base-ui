'use client';
import { Draggable } from '@base-ui/react/draggable';

import * as React from 'react';

import styles from '../../nesting.module.css';

type Location = 'palette' | 'canvas' | 'frame';
type LayerId = 'chart' | 'note';

const layerKind = Draggable.createKind<LayerId>('drop-target/nested-layer');

function ChartIcon() {
  return (
    <svg className={styles.LayerIcon} width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M2.5 13.5h11" fill="none" stroke="currentColor" />
      <rect x="3" y="8" width="2.25" height="4" fill="currentColor" />
      <rect x="6.875" y="5" width="2.25" height="7" fill="currentColor" />
      <rect x="10.75" y="2.5" width="2.25" height="9.5" fill="currentColor" />
    </svg>
  );
}

function NoteIcon() {
  return (
    <svg className={styles.LayerIcon} width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M3 4.5h10M3 8h10M3 11.5h6" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function Layer({ id }: { id: LayerId }) {
  return (
    <Draggable.Root kind={layerKind} payload={id} className={styles.Layer}>
      {id === 'chart' ? <ChartIcon /> : <NoteIcon />}
      {id === 'chart' ? 'Chart' : 'Note'}
    </Draggable.Root>
  );
}

function NestedDropTargetsContent() {
  const [locations, setLocations] = React.useState<Record<LayerId, Location>>({
    chart: 'palette',
    note: 'palette',
  });

  function placeLayer(id: LayerId, location: Location) {
    setLocations((current) => ({ ...current, [id]: location }));
  }

  function renderLayers(location: Location) {
    return (['chart', 'note'] as const)
      .filter((id) => locations[id] === location)
      .map((id) => <Layer key={id} id={id} />);
  }

  return (
    <div className={styles.Root}>
      <div className={styles.Palette}>{renderLayers('palette')}</div>
      <Draggable.Target
        className={styles.Canvas}
        accept={layerKind}
        onDraggableDrop={({ source }) => placeLayer(source.payload, 'canvas')}
      >
        <span className={styles.Label}>Canvas</span>
        <div className={styles.CanvasLayers}>{renderLayers('canvas')}</div>
        <Draggable.Target
          className={styles.Frame}
          accept={layerKind}
          // @highlight-start
          canDrop={({ source }) => source.payload === 'chart'}
          // @highlight-end
          onDraggableDrop={({ source }) => placeLayer(source.payload, 'frame')}
        >
          <span className={styles.Label}>Frame (charts only)</span>
          <div className={styles.FrameLayers}>
            {locations.chart === 'frame' ? (
              <Layer id="chart" />
            ) : (
              <span className={styles.Empty}>Drop the chart into the frame</span>
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
