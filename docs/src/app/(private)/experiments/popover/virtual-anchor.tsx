'use client';
import * as React from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Popover } from '@base-ui/react/popover';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { ownerDocument } from '@base-ui/utils/owner';
import styles from './virtual-anchor.module.css';

/**
 * Real MapLibre GL JS reproduction of the virtual anchor repositioning problem.
 *
 * A popover is anchored to a geographic coordinate via a virtual element whose
 * getBoundingClientRect() calls map.project(lngLat) to get the screen position.
 *
 * Demo 1 (Broken): Pan or zoom — the popover stays stuck at its initial screen
 * position because autoUpdate never re-reads getBoundingClientRect().
 *
 * Demo 2 (State workaround): Recreates the virtual anchor object through React
 * state on every map move so Base UI notices a new anchor identity and
 * repositions. This works, but forces React rerenders during interaction.
 *
 * Demo 3 (Fixed): Same stable virtual anchor as Demo 1, but map movement calls
 * PopoverHandle.updatePosition() so floating-ui re-reads the anchor rect
 * without rerendering. The portal is mounted inside the map container so the
 * map clips the popup at its edges.
 */

type RectSnapshot = Pick<
  DOMRectReadOnly,
  'x' | 'y' | 'width' | 'height' | 'top' | 'left' | 'right' | 'bottom'
>;

const MARKER_LNG_LAT: [number, number] = [139.7798, 35.5494]; // Haneda Airport

const MAP_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '&copy; OpenStreetMap contributors',
    },
  },
  layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
};

const ZERO_RECT: RectSnapshot = {
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
};

const DISABLE_COLLISION_AVOIDANCE = {
  side: 'none',
  align: 'none',
  fallbackAxisSide: 'none',
} as const;

function PopupContent() {
  return (
    <React.Fragment>
      <h3>Haneda Airport</h3>
      <p>35.5494 N, 139.7798 E</p>
    </React.Fragment>
  );
}

function createMarkerElement(container: HTMLElement) {
  const el = ownerDocument(container).createElement('div');
  el.style.cssText =
    'width:20px;height:20px;border-radius:50%;background:#e53935;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,.3)';
  return el;
}

function projectMarker(map: maplibregl.Map) {
  return map.project(MARKER_LNG_LAT);
}

function projectToScreen(map: maplibregl.Map): RectSnapshot {
  const { x, y } = projectMarker(map);
  const rect = map.getContainer().getBoundingClientRect();
  const screenX = rect.left + x;
  const screenY = rect.top + y;
  return {
    x: screenX,
    y: screenY,
    width: 0,
    height: 0,
    top: screenY,
    left: screenX,
    right: screenX,
    bottom: screenY,
  };
}

function createVirtualAnchor(mapRef: React.RefObject<maplibregl.Map | null>) {
  return {
    getBoundingClientRect() {
      const map = mapRef.current;
      return map ? projectToScreen(map) : ZERO_RECT;
    },
  };
}

function useMap(
  containerRef: React.RefObject<HTMLDivElement | null>,
  onReady?: (map: maplibregl.Map) => void | (() => void),
) {
  const mapRef = React.useRef<maplibregl.Map | null>(null);
  const onReadyRef = React.useRef(onReady);
  onReadyRef.current = onReady;

  useIsoLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return undefined;
    }

    const map = new maplibregl.Map({
      container,
      style: MAP_STYLE,
      center: MARKER_LNG_LAT,
      zoom: 14,
    });

    new maplibregl.Marker({ element: createMarkerElement(container) })
      .setLngLat(MARKER_LNG_LAT)
      .addTo(map);

    mapRef.current = map;
    let cleanupMapListeners: (() => void) | undefined;
    map.once('idle', () => {
      const nextCleanup = onReadyRef.current?.(map);
      cleanupMapListeners = typeof nextCleanup === 'function' ? nextCleanup : undefined;
    });

    return () => {
      cleanupMapListeners?.();
      map.remove();
      mapRef.current = null;
    };
  }, [containerRef]);

  return mapRef;
}

function DemoSection(props: {
  title: React.ReactNode;
  description: React.ReactNode;
  info: React.ReactNode;
  children: React.ReactNode;
}) {
  const { title, description, info, children } = props;

  return (
    <div>
      <h2>{title}</h2>
      <p>{description}</p>
      {children}
      <p>{info}</p>
    </div>
  );
}

// ─── Demo 1: Broken ──────────────────────────────────────────────────────
function BrokenDemo() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const mapRef = useMap(containerRef);

  // Stable virtual anchor — same object identity forever.
  // getBoundingClientRect() always returns the marker's current screen position
  // by calling map.project(), but floating-ui never re-reads it.
  const virtualAnchor = React.useRef({
    getBoundingClientRect() {
      const map = mapRef.current;
      return map ? projectToScreen(map) : ZERO_RECT;
    },
  }).current;

  return (
    <DemoSection
      title="Broken: popover does not track the marker"
      description="Pan or zoom the map. The marker moves with the map but the popover stays stuck at its initial screen position."
      info={
        <React.Fragment>
          <strong>Why it&apos;s broken:</strong> <code>autoUpdate</code> only uses{' '}
          <code>ResizeObserver</code> + <code>IntersectionObserver</code>. Neither fires for a
          virtual element. The anchor object identity never changes (same ref), so the anchor
          identity check in <code>useAnchorPositioning</code> also doesn&apos;t trigger. Result:
          popover positions once on mount, then never updates.
        </React.Fragment>
      }
    >
      <div ref={containerRef} className={styles.map} />
      <Popover.Root open>
        <Popover.Portal>
          <Popover.Positioner
            anchor={virtualAnchor}
            side="top"
            sideOffset={12}
            positionMethod="fixed"
          >
            <Popover.Popup className={styles.popup}>
              <PopupContent />
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    </DemoSection>
  );
}

// ─── Demo 2: State workaround — recreate anchor via React state ──────────
function StateWorkaroundDemo() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const mapRef = React.useRef<maplibregl.Map | null>(null);
  const [virtualAnchor, setVirtualAnchor] = React.useState(() => createVirtualAnchor(mapRef));

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
    <DemoSection
      title="Workaround: recreate the virtual anchor through React state"
      description={
        <React.Fragment>
          The map&apos;s <code>move</code> event increments React state, which recreates the virtual
          anchor object on every update. That changes the anchor identity, so Base UI re-registers
          it and floating-ui repositions the popup.
        </React.Fragment>
      }
      info={
        <React.Fragment>
          <strong>Tradeoff:</strong> This works with today&apos;s public API, but every map move now
          goes through React state and rerenders the popover subtree.
        </React.Fragment>
      }
    >
      <div ref={containerRef} className={styles.map} />
      <Popover.Root open>
        <Popover.Portal container={containerRef}>
          <Popover.Positioner
            anchor={virtualAnchor}
            side="top"
            sideOffset={12}
            collisionAvoidance={DISABLE_COLLISION_AVOIDANCE}
            positionMethod="absolute"
          >
            <Popover.Popup className={styles.popup}>
              <PopupContent />
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    </DemoSection>
  );
}

// ─── Demo 3: Fixed — stable virtual anchor + imperative reposition ───────
function FixedDemo() {
  const popover = useRefWithInit(() => Popover.createHandle()).current;
  const containerRef = React.useRef<HTMLDivElement>(null);
  const mapRef = useMap(containerRef, (map) => {
    const update = () => popover.updatePosition();
    update();
    map.on('move', update);

    return () => {
      map.off('move', update);
    };
  });

  const virtualAnchor = React.useRef({
    getBoundingClientRect() {
      const map = mapRef.current;
      return map ? projectToScreen(map) : ZERO_RECT;
    },
  }).current;

  return (
    <DemoSection
      title="Fixed: call `handle.updatePosition()` on map movement"
      description={
        <React.Fragment>
          Same stable virtual anchor as the broken demo, but the map&apos;s <code>move</code> event
          calls <code>handle.updatePosition()</code>. The popover now tracks the marker without
          recreating the anchor object or rerendering on every frame.
        </React.Fragment>
      }
      info={
        <React.Fragment>
          <strong>How it works:</strong> <code>Popover.createHandle()</code> exposes an imperative{' '}
          <code>updatePosition()</code> method. Calling it makes floating-ui re-read the existing
          virtual anchor&apos;s <code>getBoundingClientRect()</code>, so the popover follows the
          marker while keeping the same anchor object identity. The portal is mounted inside the map
          container, so the map clips any portion of the popup that would otherwise extend beyond
          its edge.
        </React.Fragment>
      }
    >
      <div ref={containerRef} className={styles.map} />
      <Popover.Root open handle={popover}>
        <Popover.Portal container={containerRef}>
          <Popover.Positioner
            anchor={virtualAnchor}
            side="top"
            sideOffset={12}
            collisionAvoidance={DISABLE_COLLISION_AVOIDANCE}
            positionMethod="absolute"
          >
            <Popover.Popup className={styles.popup}>
              <PopupContent />
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    </DemoSection>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────
export default function VirtualAnchorExperiment() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32, padding: 24 }}>
      <h1>Virtual Anchor Repositioning (MapLibre)</h1>
      <BrokenDemo />
      <hr />
      <StateWorkaroundDemo />
      <hr />
      <FixedDemo />
    </div>
  );
}
