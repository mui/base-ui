'use client';
import { Draggable } from '@base-ui/react/draggable';

import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { visuallyHidden } from '@base-ui/utils/visuallyHidden';

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

function Layer({
  id,
  onKeyDown,
}: {
  id: LayerId;
  onKeyDown: (event: React.KeyboardEvent<HTMLElement>, id: LayerId) => void;
}) {
  return (
    <Draggable.Root
      kind={layerKind}
      payload={id}
      className={styles.Layer}
      data-layer-id={id}
      tabIndex={0}
      aria-keyshortcuts="Alt+ArrowLeft Alt+ArrowRight"
      onKeyDown={(event) => onKeyDown(event, id)}
    >
      {id === 'chart' ? <ChartIcon /> : <NoteIcon />}
      {id === 'chart' ? 'Chart' : 'Note'}
    </Draggable.Root>
  );
}

export default function NestedDropTargets() {
  const [locations, setLocations] = React.useState<Record<LayerId, Location>>({
    chart: 'palette',
    note: 'palette',
  });
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const focusLayerRef = React.useRef<LayerId | null>(null);

  function placeLayer(id: LayerId, location: Location) {
    if (id === 'note' && location === 'frame') {
      return;
    }
    setLocations((current) => ({ ...current, [id]: location }));
  }

  function onLayerKeyDown(event: React.KeyboardEvent<HTMLElement>, id: LayerId) {
    if (!event.altKey || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')) {
      return;
    }
    event.preventDefault();
    const destinations: Location[] =
      id === 'chart' ? ['palette', 'canvas', 'frame'] : ['palette', 'canvas'];
    const index = destinations.indexOf(locations[id]);
    const destination = destinations[index + (event.key === 'ArrowLeft' ? -1 : 1)];
    if (destination) {
      focusLayerRef.current = id;
      placeLayer(id, destination);
    }
  }

  useIsoLayoutEffect(() => {
    const id = focusLayerRef.current;
    if (id) {
      focusLayerRef.current = null;
      rootRef.current
        ?.querySelector<HTMLElement>(`[data-layer-id="${id}"]:not([data-drag-preview])`)
        ?.focus();
    }
  }, [locations]);

  function renderLayers(location: Location) {
    return (['chart', 'note'] as const)
      .filter((id) => locations[id] === location)
      .map((id) => <Layer key={id} id={id} onKeyDown={onLayerKeyDown} />);
  }

  return (
    <Draggable.Provider>
      <div ref={rootRef} className={styles.Root}>
        <p role="status" style={visuallyHidden}>
          Chart: {locations.chart}. Note: {locations.note}.
        </p>
        <div className={styles.Palette}>{renderLayers('palette')}</div>
        <Draggable.Target
          className={styles.Canvas}
          accept={layerKind}
          onDraggableDrop={(eventDetails) => placeLayer(eventDetails.source.payload, 'canvas')}
        >
          <span className={styles.Label}>Canvas</span>
          <div className={styles.CanvasLayers}>{renderLayers('canvas')}</div>
          <Draggable.Target
            className={styles.Frame}
            accept={layerKind}
            // @highlight-start @focus @padding 3
            canDrop={({ source }) => source.payload === 'chart'}
            // @highlight-end
            onDraggableDrop={(eventDetails) => placeLayer(eventDetails.source.payload, 'frame')}
          >
            <span className={styles.Label}>Frame (charts only)</span>
            <div className={styles.FrameLayers}>
              {locations.chart === 'frame' ? (
                <Layer id="chart" onKeyDown={onLayerKeyDown} />
              ) : (
                <span className={styles.Empty}>Drop the chart into the frame</span>
              )}
            </div>
          </Draggable.Target>
        </Draggable.Target>
      </div>
    </Draggable.Provider>
  );
}
