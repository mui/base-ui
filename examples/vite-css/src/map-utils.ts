import * as React from 'react';
import maplibregl from 'maplibre-gl';

export type RectSnapshot = Pick<
  DOMRectReadOnly,
  'x' | 'y' | 'width' | 'height' | 'top' | 'left' | 'right' | 'bottom'
>;

export const MARKER_LNG_LAT: [number, number] = [139.7798, 35.5494]; // Haneda Airport

export const MAP_STYLE: maplibregl.StyleSpecification = {
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

export const ZERO_RECT: RectSnapshot = {
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
};

export const DISABLE_COLLISION_AVOIDANCE = {
  side: 'none',
  align: 'none',
  fallbackAxisSide: 'none',
} as const;

export function createMarkerElement() {
  const el = document.createElement('div');
  el.style.cssText =
    'width:20px;height:20px;border-radius:50%;background:#e53935;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,.3)';
  return el;
}

export function projectToScreen(map: maplibregl.Map): RectSnapshot {
  const { x, y } = map.project(MARKER_LNG_LAT);
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

export function createVirtualAnchor(mapRef: React.RefObject<maplibregl.Map | null>) {
  return {
    getBoundingClientRect() {
      const map = mapRef.current;
      return map ? projectToScreen(map) : ZERO_RECT;
    },
  };
}

export function useMap(
  containerRef: React.RefObject<HTMLDivElement | null>,
  onReady?: (map: maplibregl.Map) => void | (() => void),
) {
  const mapRef = React.useRef<maplibregl.Map | null>(null);
  const onReadyRef = React.useRef(onReady);
  React.useEffect(() => {
    onReadyRef.current = onReady;
  });

  React.useLayoutEffect(() => {
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

    new maplibregl.Marker({ element: createMarkerElement() }).setLngLat(MARKER_LNG_LAT).addTo(map);

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
