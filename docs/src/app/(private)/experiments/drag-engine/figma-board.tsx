'use client';
import * as React from 'react';
import clsx from 'clsx';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { ownerDocument } from '@base-ui/utils/owner';
import { DragAutoScroll } from '@base-ui/react/drag-auto-scroll';
import { Draggable } from '@base-ui/react/draggable';
import { DropTarget } from '@base-ui/react/drop-target';
import { useDragMonitor } from '@base-ui/react/use-drag-monitor';
import { SettingsMetadata, useExperimentSettings } from '../_components/SettingsPanel';
import theme from './theme.module.css';
import styles from './figma-board.module.css';

// Stress-tests drag coordinates and preview sizing under a scaled ancestor.
// Pointer coordinates and rects are in client pixels, so committed board
// coordinates are divided by the scale. A top-layer preview escapes
// `transform: scale()` but remains affected by `zoom`; the styled `scaled` clone
// compensates only for the transform case. The toolbar reports the live
// source and preview sizes so either mismatch is observable.

interface FigmaBoardSettings {
  zoomMode: 'transform' | 'zoom';
  preview: 'clone' | 'scaled';
}

export const settingsMetadata: SettingsMetadata<FigmaBoardSettings> = {
  zoomMode: {
    type: 'string',
    label: 'Scale with',
    options: ['transform', 'zoom'],
    default: 'transform',
  },
  preview: {
    type: 'string',
    label: 'Preview',
    options: ['clone', 'scaled'],
    default: 'clone',
  },
};

const cardKind = Draggable.createKind<CardDragData>('figmaBoard:card');
const CARD_WIDTH = 200;
// The board is a fixed-size scroll surface; cards are clamped inside it so they
// can never be created or dropped past an edge.
const SURFACE_WIDTH = 2400;
const SURFACE_HEIGHT = 1600;
// Approximate height of a fresh, empty card — used to clamp newly-created cards
// before their real height has been measured.
const CARD_MIN_HEIGHT = 44;
// Each card added from the toolbar is nudged down-right from the previous one so
// a burst of clicks fans out instead of stacking on a single spot.
const NEW_CARD_CASCADE = 28;
// The card's own type size, in board units. On screen it renders at `× zoom`,
// which is what a preview has to match.
const CARD_FONT_SIZE = 14;

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.25;

/** Keep a card fully inside the board given its measured height. */
function clampToSurface(x: number, y: number, height: number): { x: number; y: number } {
  const maxX = Math.max(SURFACE_WIDTH - CARD_WIDTH, 0);
  const maxY = Math.max(SURFACE_HEIGHT - height, 0);
  return {
    x: Math.min(Math.max(x, 0), maxX),
    y: Math.min(Math.max(y, 0), maxY),
  };
}

interface Card {
  id: string;
  /** Board coordinates, unscaled by the zoom. */
  x: number;
  y: number;
  text: string;
  /** Stacking order; bumped on select/drag so the active card sits on top. */
  z: number;
}

interface CardDragData {
  id: string;
  /** Where inside the card the pointer grabbed, in client pixels. */
  grabOffsetX: number;
  grabOffsetY: number;
}

const INITIAL_CARDS: Card[] = [
  { id: 'card-0', x: 140, y: 120, text: 'Double-click the canvas to add a card.', z: 1 },
  { id: 'card-1', x: 440, y: 220, text: 'Drag me anywhere on the board.', z: 2 },
  {
    id: 'card-2',
    x: 240,
    y: 360,
    text: 'Double-click a card to edit its text.\nSelect one and press Delete to remove it.',
    z: 3,
  },
];

export default function FigmaBoard() {
  return (
    <Draggable.PreviewProvider>
      <FigmaBoardInner />
    </Draggable.PreviewProvider>
  );
}

function FigmaBoardInner() {
  const { settings } = useExperimentSettings<FigmaBoardSettings>();
  const zoomMode = settings.zoomMode === 'zoom' ? 'zoom' : 'transform';
  const previewMode = settings.preview === 'scaled' ? 'scaled' : 'clone';

  const [cards, setCards] = React.useState<Card[]>(INITIAL_CARDS);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [zoom, setZoomState] = React.useState(1);
  const [panning, setPanning] = React.useState(false);
  const [spaceHeld, setSpaceHeld] = React.useState(false);

  const viewportRef = React.useRef<HTMLDivElement | null>(null);
  const surfaceRef = React.useRef<HTMLDivElement | null>(null);
  const zCounterRef = React.useRef(INITIAL_CARDS.length);
  const idCounterRef = React.useRef(INITIAL_CARDS.length);
  const addCascadeRef = React.useRef(0);
  // Event handlers run outside render, so they read the zoom from a ref rather
  // than closing over a value that may be a frame stale.
  const zoomRef = React.useRef(zoom);
  zoomRef.current = zoom;
  // Board point to re-center on after a zoom change, so zooming holds the middle
  // of the viewport still instead of drifting toward the origin.
  const recenterRef = React.useRef<{ x: number; y: number } | null>(null);

  const setZoom = useStableCallback((next: number) => {
    const clamped = Math.min(Math.max(next, MIN_ZOOM), MAX_ZOOM);
    const viewport = viewportRef.current;
    if (viewport) {
      recenterRef.current = {
        x: (viewport.scrollLeft + viewport.clientWidth / 2) / zoomRef.current,
        y: (viewport.scrollTop + viewport.clientHeight / 2) / zoomRef.current,
      };
    }
    setZoomState(clamped);
  });

  useIsoLayoutEffect(() => {
    const viewport = viewportRef.current;
    const center = recenterRef.current;
    recenterRef.current = null;
    if (!viewport || !center) {
      return;
    }
    viewport.scrollLeft = center.x * zoom - viewport.clientWidth / 2;
    viewport.scrollTop = center.y * zoom - viewport.clientHeight / 2;
  }, [zoom]);

  // Space-to-pan, the canonical canvas gesture: held space turns a press on the
  // board into a scroll drag instead of a card drag. Suppressed while editing,
  // where space is a literal character.
  const editingRef = React.useRef(editingId);
  editingRef.current = editingId;
  useIsoLayoutEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) {
      return undefined;
    }
    const doc = ownerDocument(viewport);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space' && !event.repeat && editingRef.current == null) {
        setSpaceHeld(true);
      }
    };
    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        setSpaceHeld(false);
      }
    };
    doc.addEventListener('keydown', handleKeyDown);
    doc.addEventListener('keyup', handleKeyUp);
    return () => {
      doc.removeEventListener('keydown', handleKeyDown);
      doc.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const panRef = React.useRef<{ x: number; y: number; left: number; top: number } | null>(null);

  const handlePanPointerDown = useStableCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const viewport = viewportRef.current;
    // Middle-button drag pans too, so the gesture is reachable without the keyboard.
    if (!viewport || !(spaceHeld || event.button === 1)) {
      return;
    }
    event.preventDefault();
    panRef.current = {
      x: event.clientX,
      y: event.clientY,
      left: viewport.scrollLeft,
      top: viewport.scrollTop,
    };
    viewport.setPointerCapture(event.pointerId);
    setPanning(true);
  });

  const handlePanPointerMove = useStableCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const viewport = viewportRef.current;
    const pan = panRef.current;
    if (!viewport || !pan) {
      return;
    }
    viewport.scrollLeft = pan.left - (event.clientX - pan.x);
    viewport.scrollTop = pan.top - (event.clientY - pan.y);
  });

  const handlePanPointerUp = useStableCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const viewport = viewportRef.current;
    if (!viewport || !panRef.current) {
      return;
    }
    panRef.current = null;
    if (viewport.hasPointerCapture(event.pointerId)) {
      viewport.releasePointerCapture(event.pointerId);
    }
    setPanning(false);
  });

  const raiseToFront = useStableCallback((id: string) => {
    zCounterRef.current += 1;
    const z = zCounterRef.current;
    setCards((prev) => prev.map((card) => (card.id === id ? { ...card, z } : card)));
  });

  const createCard = useStableCallback((x: number, y: number) => {
    idCounterRef.current += 1;
    zCounterRef.current += 1;
    const id = `card-${idCounterRef.current}`;
    const position = clampToSurface(x, y, CARD_MIN_HEIGHT);
    setCards((prev) => [
      ...prev,
      { id, x: position.x, y: position.y, text: '', z: zCounterRef.current },
    ]);
    setSelectedId(id);
    setEditingId(id);
  });

  const moveCard = useStableCallback((id: string, x: number, y: number) => {
    setCards((prev) => prev.map((card) => (card.id === id ? { ...card, x, y } : card)));
  });

  const updateText = useStableCallback((id: string, text: string) => {
    setCards((prev) => prev.map((card) => (card.id === id ? { ...card, text } : card)));
  });

  const deleteCard = useStableCallback((id: string) => {
    setCards((prev) => prev.filter((card) => card.id !== id));
    setSelectedId((prev) => (prev === id ? null : prev));
    setEditingId((prev) => (prev === id ? null : prev));
  });

  const selectCard = useStableCallback((id: string) => {
    setSelectedId(id);
    raiseToFront(id);
  });

  const endEdit = useStableCallback((id: string) => {
    setEditingId((prev) => (prev === id ? null : prev));
  });

  const handleAddCard = useStableCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }
    // Center the card in the visible area. The viewport's scroll and client sizes
    // are client px over a scaled board, so they divide by the zoom to become
    // board coordinates. Successive cards fan out so clicks don't pile onto one spot.
    const scale = zoomRef.current;
    const cascade = (addCascadeRef.current % 5) * NEW_CARD_CASCADE;
    addCascadeRef.current += 1;
    const x = (viewport.scrollLeft + viewport.clientWidth / 2) / scale - CARD_WIDTH / 2 + cascade;
    const y =
      (viewport.scrollTop + viewport.clientHeight / 2) / scale - CARD_MIN_HEIGHT / 2 + cascade;
    createCard(Math.round(x), Math.round(y));
  });

  const handleSurfacePointerDown = (event: React.PointerEvent) => {
    // Only a press on the bare surface (not a card) clears the selection.
    if (event.target === event.currentTarget) {
      setSelectedId(null);
      setEditingId(null);
    }
  };

  const handleSurfaceDoubleClick = (event: React.MouseEvent) => {
    if (event.target !== event.currentTarget) {
      return;
    }
    const surface = surfaceRef.current;
    if (!surface) {
      return;
    }
    // The surface scrolls with its content, so its client rect already accounts
    // for the scroll offset: pointer minus rect is the position on the surface —
    // in client px, so it divides by the zoom to land in board coordinates.
    // Offset by half the card so it's centered under the pointer.
    const scale = zoomRef.current;
    const rect = surface.getBoundingClientRect();
    const x = Math.round((event.clientX - rect.left) / scale - CARD_WIDTH / 2);
    const y = Math.round((event.clientY - rect.top) / scale - CARD_MIN_HEIGHT / 2);
    createCard(x, y);
  };

  return (
    <div className={clsx(theme.tokens, styles.root)} style={{ '--z': zoom } as React.CSSProperties}>
      <div className={styles.toolbar}>
        <h1 className={styles.title}>Figma board</h1>

        <div className={styles.zoomControls}>
          <button
            type="button"
            className={styles.button}
            onClick={() => setZoom(zoom - ZOOM_STEP)}
            disabled={zoom <= MIN_ZOOM}
            aria-label="Zoom out"
          >
            −
          </button>
          <input
            type="range"
            className={styles.slider}
            min={MIN_ZOOM * 100}
            max={MAX_ZOOM * 100}
            step={5}
            value={Math.round(zoom * 100)}
            onChange={(event) => setZoom(Number(event.target.value) / 100)}
            aria-label="Zoom level"
          />
          <button
            type="button"
            className={styles.button}
            onClick={() => setZoom(zoom + ZOOM_STEP)}
            disabled={zoom >= MAX_ZOOM}
            aria-label="Zoom in"
          >
            +
          </button>
          <output className={styles.zoomValue}>{Math.round(zoom * 100)}%</output>
          <button type="button" className={styles.button} onClick={() => setZoom(1)}>
            Reset
          </button>
        </div>

        <button type="button" className={styles.button} onClick={handleAddCard}>
          Add card
        </button>

        <PreviewReadout zoom={zoom} />
      </div>

      <p className={styles.hint}>
        Double-click to add a card · drag to move · double-click a card to edit · Delete to remove ·
        hold <kbd className={styles.kbd}>Space</kbd> or the middle button to pan
      </p>

      {/* Auto-scroll the board while dragging near its edges. Its thresholds are
          client px, so at 25% they cover four times as much board as at 100%.
          `viewportRef` is also read for the preview modifier and the add-card math. */}
      <DragAutoScroll.Root
        className={clsx(styles.viewport, panning && styles.viewportPanning)}
        ref={viewportRef}
        data-space-held={spaceHeld || undefined}
        onPointerDown={handlePanPointerDown}
        onPointerMove={handlePanPointerMove}
        onPointerUp={handlePanPointerUp}
        onPointerCancel={handlePanPointerUp}
      >
        {/* `transform` leaves layout at 1×, so the scroll extent has to be sized by
            hand; `zoom` reflows and sizes itself. */}
        <div
          className={styles.sizer}
          style={
            zoomMode === 'transform'
              ? { width: SURFACE_WIDTH * zoom, height: SURFACE_HEIGHT * zoom }
              : undefined
          }
        >
          {/* The whole surface is a drop target, so a pointer release anywhere on the
              board counts as a real drop rather than a cancel. */}
          <DropTarget.Root
            className={clsx(styles.surface, zoomMode === 'transform' && styles.surfaceTransformed)}
            ref={surfaceRef}
            accept={cardKind}
            trackDragOver={false}
            style={
              zoomMode === 'transform'
                ? { width: SURFACE_WIDTH, height: SURFACE_HEIGHT, transform: `scale(${zoom})` }
                : { width: SURFACE_WIDTH, height: SURFACE_HEIGHT, zoom }
            }
            onPointerDown={handleSurfacePointerDown}
            onDoubleClick={handleSurfaceDoubleClick}
          >
            {cards.map((card) => (
              <BoardCard
                key={card.id}
                card={card}
                selected={selectedId === card.id}
                editing={editingId === card.id}
                compensatePreview={previewMode === 'scaled' && zoomMode === 'transform'}
                zoomRef={zoomRef}
                onSelect={selectCard}
                onEdit={setEditingId}
                onEndEdit={endEdit}
                onChangeText={updateText}
                onMove={moveCard}
                onDelete={deleteCard}
                boundaryRef={viewportRef}
                surfaceRef={surfaceRef}
              />
            ))}
          </DropTarget.Root>
        </div>
      </DragAutoScroll.Root>
    </div>
  );
}

function BoardCard({
  card,
  selected,
  editing,
  compensatePreview,
  zoomRef,
  onSelect,
  onEdit,
  onEndEdit,
  onChangeText,
  onMove,
  onDelete,
  boundaryRef,
  surfaceRef,
}: {
  card: Card;
  selected: boolean;
  editing: boolean;
  compensatePreview: boolean;
  zoomRef: React.RefObject<number>;
  onSelect: (id: string) => void;
  onEdit: (id: string) => void;
  onEndEdit: (id: string) => void;
  onChangeText: (id: string, text: string) => void;
  onMove: (id: string, x: number, y: number) => void;
  onDelete: (id: string) => void;
  boundaryRef: React.RefObject<HTMLDivElement | null>;
  surfaceRef: React.RefObject<HTMLDivElement | null>;
}) {
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);
  // Our own element ref, to read the card's height on drop.
  const cardRef = React.useRef<HTMLDivElement | null>(null);

  // While editing, focus the textarea and keep its height synced to its content
  // so the editor matches the static text it replaces.
  useIsoLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!editing || !textarea) {
      return;
    }
    textarea.focus();
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [editing, card.text]);

  return (
    <Draggable.Root
      ref={cardRef}
      kind={cardKind}
      // Capture where in the card the pointer grabbed (client px). The drop maps it
      // back to a surface position from a fresh surface rect, so it stays correct
      // even when auto-scroll moves the board mid-drag.
      getPayload={(feedback) => {
        const rect = feedback.element.getBoundingClientRect();
        return {
          id: card.id,
          grabOffsetX: feedback.input.clientX - rect.left,
          grabOffsetY: feedback.input.clientY - rect.top,
        };
      }}
      disabled={editing}
      data-compensate-preview={compensatePreview ? '' : undefined}
      // Distance activation instead of the `immediate` mouse default: a plain click
      // — and the second click of a double-click-to-edit — must not be swallowed by
      // a drag that commits on pointerdown. A real drag still starts after a 5px move.
      pointerActivation={{ mouse: { type: 'distance', distance: 5 } }}
      // Clamp the drag to the surface. A modifier
      // governs drop resolution too, so a release off the board resolves the
      // surface instead of cancelling. The surface rect is client-space, so this
      // stays correct at any zoom with no conversion.
      modifiers={Draggable.restrictToElement(surfaceRef)}
      // `onDrop` fires only for a release over the surface, so a drag that never
      // landed (Escape, or released off it) simply doesn't reach here.
      onDrop={({ source, location }) => {
        const surface = surfaceRef.current;
        if (!surface) {
          return;
        }
        // Re-measure the surface at drop so the result accounts for any scrolling
        // (manual or auto) since the drag began. The rect is scaled and the grab
        // offset was measured on the scaled card, so the whole client-space
        // expression divides by the zoom to land back in board coordinates.
        // `offsetHeight` is a layout value, already in board units.
        const scale = zoomRef.current;
        const rect = surface.getBoundingClientRect();
        const height = cardRef.current?.offsetHeight ?? CARD_MIN_HEIGHT;
        const newX =
          (location.current.input.clientX - source.payload.grabOffsetX - rect.left) / scale;
        const newY =
          (location.current.input.clientY - source.payload.grabOffsetY - rect.top) / scale;
        const position = clampToSurface(newX, newY, height);
        onMove(source.payload.id, Math.round(position.x), Math.round(position.y));
      }}
      className={(state) =>
        clsx(styles.card, selected && styles.cardSelected, state.dragging && styles.cardDragging)
      }
      style={{ left: card.x, top: card.y, width: CARD_WIDTH, zIndex: card.z }}
      role="button"
      tabIndex={0}
      aria-label={card.text || 'Empty card'}
      aria-keyshortcuts="ArrowUp ArrowDown ArrowLeft ArrowRight Delete Backspace"
      onPointerDown={(event) => {
        if (editing) {
          return;
        }
        onSelect(card.id);
        // Keep keyboard focus on the card so Delete/Backspace target it.
        event.currentTarget.focus();
      }}
      onKeyDown={(event) => {
        // The textarea stops key events from bubbling while editing, so this
        // only runs when the card itself is focused.
        if (event.key === 'Delete' || event.key === 'Backspace') {
          event.preventDefault();
          onDelete(card.id);
          return;
        }
        const step = event.shiftKey ? 10 : 1;
        const directions: Record<string, [number, number]> = {
          ArrowUp: [0, -step],
          ArrowDown: [0, step],
          ArrowLeft: [-step, 0],
          ArrowRight: [step, 0],
        };
        const delta = directions[event.key];
        if (delta) {
          event.preventDefault();
          const height = cardRef.current?.offsetHeight ?? CARD_MIN_HEIGHT;
          const position = clampToSurface(card.x + delta[0], card.y + delta[1], height);
          onMove(card.id, Math.round(position.x), Math.round(position.y));
          onSelect(card.id);
        }
      }}
      onDoubleClick={(event) => {
        event.stopPropagation();
        onEdit(card.id);
      }}
    >
      {editing ? (
        <textarea
          ref={textareaRef}
          className={styles.textarea}
          value={card.text}
          placeholder="Type…"
          rows={1}
          onChange={(event) => onChangeText(card.id, event.target.value)}
          onBlur={() => onEndEdit(card.id)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.currentTarget.blur();
            }
            // Keep edit keystrokes (including Backspace) inside the textarea.
            event.stopPropagation();
          }}
        />
      ) : (
        <CardText text={card.text} />
      )}
      {/* The clone reuses the card and text markup. In transform mode the optional
          data attribute lets CSS scale its visual properties back to the source's
          painted size; native CSS zoom already reaches the clone without compensation. */}
      <Draggable.ClonedPreview modifiers={Draggable.restrictToElement(boundaryRef)} />
    </Draggable.Root>
  );
}

// The card's static text. Empty cards show the placeholder the textarea would.
function CardText({ text }: { text: string }) {
  if (text === '') {
    return <div className={clsx(styles.text, styles.placeholder)}>Type…</div>;
  }
  return <div className={styles.text}>{text}</div>;
}

interface Measurement {
  sourceWidth: number;
  sourceHeight: number;
  previewWidth: number;
  previewHeight: number;
  previewFontSize: number;
  /** Whether the preview's content is taller than the box it was given. */
  previewClips: boolean;
}

/**
 * Live source-vs-preview comparison. Include any visual/layout scale in the
 * effective painted type size, then report it alongside the box and overflow.
 */
function PreviewReadout({ zoom }: { zoom: number }) {
  const [measurement, setMeasurement] = React.useState<Measurement | null>(null);

  useDragMonitor({
    accept: cardKind,
    onDrag: ({ source }) => {
      const element = source.element;
      const doc = ownerDocument(element);
      const view = doc.defaultView;
      const preview = doc.querySelector<HTMLElement>('[data-drag-preview]');
      if (!preview || !view) {
        return;
      }
      const sourceRect = element.getBoundingClientRect();
      const previewRect = preview.getBoundingClientRect();
      const visualScale = preview.offsetWidth > 0 ? previewRect.width / preview.offsetWidth : 1;
      const text = preview.firstElementChild ?? preview;
      const paintedFontSize = parseFloat(view.getComputedStyle(text).fontSize) * visualScale;
      const next: Measurement = {
        sourceWidth: Math.round(sourceRect.width),
        sourceHeight: Math.round(sourceRect.height),
        previewWidth: Math.round(previewRect.width),
        previewHeight: Math.round(previewRect.height),
        previewFontSize: Math.round(paintedFontSize * 10) / 10,
        previewClips: preview.scrollHeight > preview.clientHeight,
      };
      setMeasurement((prev) =>
        prev != null &&
        prev.sourceWidth === next.sourceWidth &&
        prev.sourceHeight === next.sourceHeight &&
        prev.previewWidth === next.previewWidth &&
        prev.previewHeight === next.previewHeight &&
        prev.previewFontSize === next.previewFontSize &&
        prev.previewClips === next.previewClips
          ? prev
          : next,
      );
    },
    onDragEnd: () => setMeasurement(null),
  });

  if (!measurement) {
    return <p className={styles.readout}>Drag a card to compare it with its preview.</p>;
  }

  // The card's type is 14px in board units, so on screen it renders at 14 × zoom.
  const expectedFontSize = Math.round(CARD_FONT_SIZE * zoom * 10) / 10;
  const typeMatches = measurement.previewFontSize === expectedFontSize;

  return (
    <p className={styles.readout}>
      <span>
        source {measurement.sourceWidth}×{measurement.sourceHeight}
      </span>
      <span>
        preview {measurement.previewWidth}×{measurement.previewHeight}
      </span>
      <span className={typeMatches ? undefined : styles.bad}>
        type {measurement.previewFontSize}px / {expectedFontSize}px
      </span>
      {measurement.previewClips && <span className={styles.bad}>content clips</span>}
    </p>
  );
}
