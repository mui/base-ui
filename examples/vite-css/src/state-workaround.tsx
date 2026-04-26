import * as React from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Popover } from '@base-ui/react/popover';
import { DISABLE_COLLISION_AVOIDANCE, ZERO_RECT, createVirtualAnchor, useMap } from './map-utils';
import './map-popover.css';

function MapPopover({ containerRef }: { containerRef: React.RefObject<HTMLDivElement | null> }) {
  const mapRef = React.useRef<import('maplibre-gl').Map | null>(null);
  const [virtualAnchor, setVirtualAnchor] = React.useState(() => ({
    getBoundingClientRect: () => ZERO_RECT,
  }));

  useMap(containerRef, (map) => {
    mapRef.current = map;

    const update = () => {
      setVirtualAnchor(createVirtualAnchor(mapRef));
    };

    update();
    map.on('move', update);

    return () => {
      map.off('move', update);
      mapRef.current = null;
    };
  });

  return (
    <Popover.Root open>
      <Popover.Portal container={containerRef}>
        <Popover.Positioner
          anchor={virtualAnchor}
          side="top"
          sideOffset={12}
          collisionAvoidance={DISABLE_COLLISION_AVOIDANCE}
          positionMethod="absolute"
        >
          <Popover.Popup className="popup">
            <h3>Haneda Airport</h3>
            <p>35.5494 N, 139.7798 E</p>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

export default function StateWorkaround() {
  const containerRef = React.useRef<HTMLDivElement>(null);

  return (
    <div style={{ padding: 24 }}>
      <h1>State workaround</h1>
      <p>
        Recreates the virtual anchor object via React state on every map move. The popover tracks
        correctly but forces rerenders on every frame.
      </p>
      <div ref={containerRef} className="map" />
      <MapPopover containerRef={containerRef} />
    </div>
  );
}
