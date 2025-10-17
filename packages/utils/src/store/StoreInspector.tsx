import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Store } from './Store';
import { ReactStore } from './ReactStore';
import { useForcedRerendering } from '../useForcedRerendering';
import { useEventCallback } from '../useEventCallback';
import { useAnimationFrame } from '../useAnimationFrame';
import { useIsoLayoutEffect } from '../useIsoLayoutEffect';

const STYLES = `
.baseui-store-inspector-trigger {
  all: unset;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: oklch(0.651 0.078 264);
}

.baseui-store-inspector-trigger:hover,
.baseui-store-inspector-trigger:focus-visible {
 opacity: 0.8;
}

.baseui-store-inspector-content {
  background: #101010;
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  padding-bottom: 12px;
  scrollbar-width: thin;
  padding: 8px;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.baseui-store-inspector-content h3 {
  text-transform: uppercase;
  font-weight: bold;
}

.baseui-store-inspector-content pre {
  margin: 0 0 16px 0;
}

.baseui-store-inspector-content pre:last-child {
  margin-bottom: 0;
}

.baseui-store-inspector-root {
  position: fixed;
  background: oklch(0.34 0.036 264);
  color: #fff;
  z-index: 1000;
  font-size: 12px;
  padding: 8px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  color-scheme: dark;
  overflow: clip;
  box-shadow:
    0 10px 15px -3px oklch(12% 9% 264deg / 8%),
    0 4px 6px -4px oklch(12% 9% 264deg / 8%);
}

.baseui-store-inspector-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: move;
  user-select: none;
  -webkit-user-select: none;
  touch-action: none;
  padding: 4px 8px 8px 8px;
}

.baseui-store-inspector-header h2 {
  font-size: 16px;
}

.baseui-store-inspector-header button {
  all: unset;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: default;
}

.baseui-store-inspector-header button:hover,
.baseui-store-inspector-header button:focus-visible {
  opacity: 0.8;
}

.baseui-store-inspector-resize-handle {
  position: absolute;
  width: 8px;
  height: 8px;
  right: -4px;
  bottom: -4px;
  cursor: se-resize;
  background: linear-gradient(135deg, transparent 50%, rgba(255, 255, 255, 0.25) 50%);
  border-radius: 2px;
}
`;

export interface StoreInspectorProps {
  /**
   * Instance of the store to inspect.
   */
  store: Store<any>;
  /**
   * Additional data to display in the inspector.
   */
  additionalData?: any;
  /**
   * Title to display in the panel header.
   */
  title?: string;
}

/**
 * A tool to inspect the state of a Store in a floating panel.
 * This is intended for development and debugging purposes.
 */
export function StoreInspector(props: StoreInspectorProps) {
  const { store, title, additionalData } = props;
  const [open, setOpen] = React.useState(false);

  let content: React.ReactNode = null;
  if (open) {
    content = ReactDOM.createPortal(
      <StoreInspectorPanel
        store={store}
        title={title}
        additionalData={additionalData}
        onClose={() => setOpen(false)}
      />,
      document.body,
    );
  }

  return (
    <React.Fragment>
      <style href="baseui-store-inspector" precedence="default">
        {STYLES}
      </style>
      <button
        className="baseui-store-inspector-trigger"
        type="button"
        onClick={() => setOpen((o) => !o)}
        title="Toggle store inspector"
      >
        <FileJson />
      </button>
      {content}
    </React.Fragment>
  );
}

interface PanelProps {
  store: Store<any>;
  title?: string;
  additionalData?: any;
  onClose: () => void;
}

function StoreInspectorPanel({ store, title, additionalData, onClose }: PanelProps) {
  const rerender = useForcedRerendering();

  // Update when state changes
  React.useEffect(() => {
    const unsubscribe = store.subscribe(rerender);
    rerender();
    return unsubscribe;
  }, [store, rerender]);

  return (
    <Window title={title ?? 'Store Inspector'} onClose={onClose}>
      <h3>State</h3>
      <pre>{JSON.stringify(store.state, getStringifyReplacer(), 2)}</pre>
      {store instanceof ReactStore && Object.keys((store as any).context ?? {}).length > 0 && (
        <React.Fragment>
          <h3>Context</h3>
          <pre>{JSON.stringify((store as any).context, getStringifyReplacer(), 2)}</pre>
        </React.Fragment>
      )}
      {additionalData !== undefined && (
        <React.Fragment>
          <h3>Additional data</h3>
          <pre>{JSON.stringify(additionalData, getStringifyReplacer(), 2)}</pre>
        </React.Fragment>
      )}
    </Window>
  );
}

function getStringifyReplacer() {
  const ancestors: any[] = [];

  return function replacer(this: unknown, _: string, value: unknown) {
    if (value instanceof Element) {
      return `Element(${value.tagName.toLowerCase()}${value.id ? `#${value.id}` : ''})`;
    }

    if (value === undefined) {
      return '[undefined]';
    }

    if (value instanceof Map) {
      return Array.from(value.entries());
    }

    if (value instanceof Set) {
      return Array.from(value);
    }

    if (typeof value !== 'object' || value === null) {
      return value;
    }
    // `this` is the object that value is contained in,
    // i.e., its direct parent.
    while (ancestors.length > 0 && ancestors.at(-1) !== this) {
      ancestors.pop();
    }

    if (ancestors.includes(value)) {
      return '[circular reference]';
    }

    ancestors.push(value);
    return value;
  };
}

interface WindowProps {
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
}

/**
 * A reusable draggable and resizable window component.
 * Handles all the pointer events for dragging and resizing internally.
 */
function Window({ title, onClose, children }: WindowProps) {
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const headerRef = React.useRef<HTMLDivElement | null>(null);
  const resizeHandleRef = React.useRef<HTMLDivElement | null>(null);
  const raf = useAnimationFrame();
  const minWidth = 160;
  const minHeight = 52;

  // Track position when user drags the window
  const [position, setPosition] = React.useState<{ left: number; top: number } | null>(null);
  const dragStateRef = React.useRef<{
    dragging: boolean;
    startX: number;
    startY: number;
    startLeft: number;
    startTop: number;
    maxLeft: number;
    maxTop: number;
  } | null>(null);

  // Track size when user resizes the window
  const [size, setSize] = React.useState<{ width: number; height: number } | null>(null);
  const resizeStateRef = React.useRef<{
    resizing: boolean;
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
    minWidth: number;
    minHeight: number;
    maxWidth: number;
    maxHeight: number;
  } | null>(null);

  useIsoLayoutEffect(() => {
    if (position != null) {
      return;
    }
    const el = rootRef.current;
    if (!el) {
      return;
    }

    setPosition({ left: 8, top: 8 });
  }, [position]);

  const onPointerDown = useEventCallback((event: React.PointerEvent) => {
    if (!headerRef.current || !rootRef.current) {
      return;
    }
    const target = event.target as Element | null;
    if (target && target.closest('button')) {
      return;
    }
    const currentPos = position ?? { left: 8, top: 8 };
    const rect = rootRef.current.getBoundingClientRect();
    const maxLeft = Math.max(0, window.innerWidth - rect.width);
    const maxTop = Math.max(0, window.innerHeight - rect.height);
    dragStateRef.current = {
      dragging: true,
      startX: event.clientX,
      startY: event.clientY,
      startLeft: currentPos.left,
      startTop: currentPos.top,
      maxLeft,
      maxTop,
    };
    try {
      headerRef.current.setPointerCapture(event.pointerId);
    } catch {
      void 0;
    }
    event.preventDefault();
  });

  const endDrag = useEventCallback((event?: PointerEvent) => {
    if (headerRef.current && event) {
      try {
        headerRef.current.releasePointerCapture(event.pointerId);
      } catch {
        void 0;
      }
    }
    if (dragStateRef.current) {
      dragStateRef.current.dragging = false;
    }
  });

  const onPointerMove = useEventCallback((event: PointerEvent) => {
    const state = dragStateRef.current;
    if (!state || !state.dragging) {
      return;
    }
    const nextLeft = Math.min(
      state.maxLeft,
      Math.max(0, state.startLeft + (event.clientX - state.startX)),
    );
    const nextTop = Math.min(
      state.maxTop,
      Math.max(0, state.startTop + (event.clientY - state.startY)),
    );
    raf.request(() => {
      setPosition({ left: nextLeft, top: nextTop });
    });
  });

  const onResizePointerDown = useEventCallback((event: React.PointerEvent) => {
    if (!rootRef.current) {
      return;
    }
    const rect = rootRef.current.getBoundingClientRect();
    const currentSize = size ?? { width: rect.width, height: rect.height };
    const currentLeft = position?.left ?? rect.left;
    const currentTop = position?.top ?? rect.top;
    const maxWidth = Math.max(100, window.innerWidth - currentLeft);
    const maxHeight = Math.max(80, window.innerHeight - currentTop);
    resizeStateRef.current = {
      resizing: true,
      startX: event.clientX,
      startY: event.clientY,
      startWidth: currentSize.width,
      startHeight: currentSize.height,
      minWidth,
      minHeight,
      maxWidth,
      maxHeight,
    };
    try {
      (event.currentTarget as any)?.setPointerCapture?.((event as any).pointerId);
    } catch {
      void 0;
    }
    event.preventDefault();
  });

  const onResizePointerMove = useEventCallback((event: PointerEvent) => {
    const state = resizeStateRef.current;
    if (!state || !state.resizing) {
      return;
    }
    const dx = event.clientX - state.startX;
    const dy = event.clientY - state.startY;
    const nextWidth = Math.min(state.maxWidth, Math.max(state.minWidth, state.startWidth + dx));
    const nextHeight = Math.min(state.maxHeight, Math.max(state.minHeight, state.startHeight + dy));
    raf.request(() => {
      setSize({ width: nextWidth, height: nextHeight });
    });
  });

  const endResize = useEventCallback((event?: PointerEvent) => {
    if (event) {
      try {
        (event.target as any)?.releasePointerCapture?.((event as any).pointerId);
      } catch {
        void 0;
      }
    }
    if (resizeStateRef.current) {
      resizeStateRef.current.resizing = false;
    }
  });

  // Bind/unbind global listeners for dragging and resizing
  useIsoLayoutEffect(() => {
    const move = (event: PointerEvent) => {
      onPointerMove(event);
      onResizePointerMove(event);
    };
    const up = (event: PointerEvent) => {
      endDrag(event);
      endResize(event);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Compute window style once per render
  const style: React.CSSProperties = {};
  const viewportMax =
    typeof window !== 'undefined' ? Math.max(0, window.innerHeight - 16) : undefined;
  if (position) {
    style.top = position.top;
    style.left = position.left;
    style.right = 'auto';
    style.position = 'fixed';
    if (size?.width != null) {
      style.width = size.width;
    }
    if (size?.height != null) {
      style.height = size.height;
    }
    style.maxHeight =
      typeof window !== 'undefined'
        ? Math.max(0, window.innerHeight - position.top - 8)
        : undefined;
  } else {
    if (size?.width != null) {
      style.width = size.width;
    }
    if (size?.height != null) {
      style.height = size.height;
    }
    style.maxHeight = viewportMax;
  }

  return (
    <div ref={rootRef} className="baseui-store-inspector-root" style={style}>
      <div ref={headerRef} className="baseui-store-inspector-header" onPointerDown={onPointerDown}>
        <h2>{title}</h2>
        <button type="button" onClick={onClose} title="Close window">
          <CloseIcon />
        </button>
      </div>
      <div className="baseui-store-inspector-content">{children}</div>
      <div
        ref={resizeHandleRef}
        onPointerDown={onResizePointerDown}
        style={{ position: 'relative' }}
      >
        <div className="baseui-store-inspector-resize-handle" />
      </div>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m15 9-6 6" />
      <path d="m9 9 6 6" />
    </svg>
  );
}

function FileJson() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="M10 12a1 1 0 0 0-1 1v1a1 1 0 0 1-1 1 1 1 0 0 1 1 1v1a1 1 0 0 0 1 1" />
      <path d="M14 18a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1 1 1 0 0 1-1-1v-1a1 1 0 0 0-1-1" />
    </svg>
  );
}
