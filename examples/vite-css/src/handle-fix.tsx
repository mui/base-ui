import * as React from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Popover } from '@base-ui/react/popover';
import { ZERO_RECT, DISABLE_COLLISION_AVOIDANCE, projectToScreen, useMap } from './map-utils';
import './map-popover.css';

export default function HandleFix() {
  const [popover] = React.useState(() => Popover.createHandle());
  const containerRef = React.useRef<HTMLDivElement>(null);
  const mapRef = useMap(containerRef, (map) => {
    const update = () => popover.updatePosition();
    update();
    map.on('move', update);

    return () => {
      map.off('move', update);
    };
  });

  const [virtualAnchor] = React.useState(() => ({
    getBoundingClientRect() {
      const map = mapRef.current;
      return map ? projectToScreen(map) : ZERO_RECT;
    },
  }));

  return (
    <div style={{ padding: 24 }}>
      <h1>Fixed: handle.updatePosition()</h1>
      <p>
        Same stable virtual anchor, but map movement calls <code>handle.updatePosition()</code>. No
        rerenders during interaction.
      </p>
      <div ref={containerRef} className="map" />
      <Popover.Root open handle={popover}>
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
    </div>
  );
}
