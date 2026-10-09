'use client';
import { Draggable } from '@base-ui/react/draggable';

import * as React from 'react';
import clsx from 'clsx';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { ownerDocument } from '@base-ui/utils/owner';
import { DragPageAutoScroll } from '../../../(docs)/react/utils/draggable/demos/DragPageAutoScroll';

import type { SettingsMetadata } from '../_components/SettingsPanel';
import { useExperimentSettings } from '../_components/SettingsPanel';
import theme from './theme.module.css';
import styles from './figma-board.module.css';

// Tests drag coordinates and preview sizing under a scaled ancestor. Pointer coordinates
// are client pixels, so commits divide by the scale. A top-layer preview escapes
// `transform: scale()` but still picks up `zoom`. The toolbar shows live source and
// preview sizes to expose either mismatch.

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

const cardKind = Draggable.createKind<string, CardDragPayload>('figmaBoard:card');
const CARD_WIDTH = 200;
const SURFACE_WIDTH = 2400;
const SURFACE_HEIGHT = 1600;
// Rough height of an empty card, for clamping before the real height is measured.
const CARD_MIN_HEIGHT = 44;
// Offset between cards added from the toolbar, so repeated clicks fan out.
const NEW_CARD_CASCADE = 28;
// In board units. On screen it renders at this size times the zoom, and the preview must match.
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
  /** Stacking order. Bumped on select and drag so the active card sits on top. */
  z: number;
}

interface CardDragPayload {
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
    <Draggable.Provider>
      <DragPageAutoScroll accept={cardKind} />
      <FigmaBoardInner />
    </Draggable.Provider>
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
  // Handlers read the zoom from a ref, since a closed-over value can be a frame stale.
  const zoomRef = React.useRef(zoom);
  zoomRef.current = zoom;
  // Board point to re-center on after a zoom change, so zooming holds the viewport's
  // middle still instead of drifting toward the origin.
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

  // Hold Space to pan: a press then scrolls the board instead of dragging a card.
  // Off while editing, where Space types a space.
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
    // Center the card in the visible area. Scroll and client sizes are client px over a
    // scaled board, so divide them by the zoom.
    const scale = zoomRef.current;
    const cascade = (addCascadeRef.current % 5) * NEW_CARD_CASCADE;
    addCascadeRef.current += 1;
    const x = (viewport.scrollLeft + viewport.clientWidth / 2) / scale - CARD_WIDTH / 2 + cascade;
    const y =
      (viewport.scrollTop + viewport.clientHeight / 2) / scale - CARD_MIN_HEIGHT / 2 + cascade;
    createCard(Math.round(x), Math.round(y));
  });

  const handleSurfacePointerDown = (event: React.PointerEvent) => {
    // Only a press on the empty surface, not on a card, clears the selection.
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
    // The surface's client rect already includes the scroll offset. Divide by the zoom
    // for board coordinates, then center the card under the pointer.
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

      {/* Edge thresholds are client px, so at 25% they cover four times as much board. */}
      <Draggable.Viewport
        className={clsx(styles.viewport, panning && styles.viewportPanning)}
        ref={viewportRef}
        data-space-held={spaceHeld || undefined}
        onPointerDown={handlePanPointerDown}
        onPointerMove={handlePanPointerMove}
        onPointerUp={handlePanPointerUp}
        onPointerCancel={handlePanPointerUp}
      >
        {/* `transform` doesn't change the layout size, so size the scroll extent by
            hand. `zoom` reflows and sizes itself. */}
        <div
          className={styles.sizer}
          style={
            zoomMode === 'transform'
              ? { width: SURFACE_WIDTH * zoom, height: SURFACE_HEIGHT * zoom }
              : undefined
          }
        >
          {/* The whole surface is a drop target, so a release anywhere on it is a drop. */}
          <Draggable.Target
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
          </Draggable.Target>
        </div>
      </Draggable.Viewport>
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
  // The card's own element, to read its height on drop.
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
      payload={card.id}
      // Record where the pointer grabbed the card, in client px, for the drop math.
      onMoveStart={(eventDetails) => {
        const rect = eventDetails.source.element.getBoundingClientRect();
        eventDetails.source.updateDragData({
          grabOffsetX: eventDetails.location.initial.input.clientX - rect.left,
          grabOffsetY: eventDetails.location.initial.input.clientY - rect.top,
        });
      }}
      disabled={editing}
      data-compensate-preview={compensatePreview ? '' : undefined}
      // Modifiers also apply to drop resolution, so a release off the board still lands
      // on the surface. The rect is in client space, so this works at any zoom.
      modifiers={Draggable.restrictToElement(surfaceRef)}
      // Escape also runs the end handler, so commit only a release over the surface.
      onMoveEnd={(eventDetails) => {
        if (eventDetails.target !== null) {
          if (!eventDetails.source.dragData) {
            return;
          }

          const surface = surfaceRef.current;
          if (!surface) {
            return;
          }
          // Re-measure the surface to account for scrolling during the drag. The rect and
          // the grab offset are both client px, so divide the whole expression by the
          // zoom. `offsetHeight` is a layout value, already in board units.
          const scale = zoomRef.current;
          const rect = surface.getBoundingClientRect();
          const height = cardRef.current?.offsetHeight ?? CARD_MIN_HEIGHT;
          const newX =
            (eventDetails.location.current.input.clientX -
              eventDetails.source.dragData.grabOffsetX -
              rect.left) /
            scale;
          const newY =
            (eventDetails.location.current.input.clientY -
              eventDetails.source.dragData.grabOffsetY -
              rect.top) /
            scale;
          const position = clampToSurface(newX, newY, height);
          onMove(eventDetails.source.payload, Math.round(position.x), Math.round(position.y));
        }
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
      {/* In transform mode, `data-compensate-preview` lets CSS scale the clone back to
          the source's painted size. CSS `zoom` already applies to the clone. */}
      <Draggable.Preview modifiers={Draggable.restrictToElement(boundaryRef)} />
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

/** Live comparison of the source and its preview: painted font size, box size and overflow. */
function PreviewReadout({ zoom }: { zoom: number }) {
  const [measurement, setMeasurement] = React.useState<Measurement | null>(null);

  Draggable.useMonitor({
    accept: cardKind,
    onMove: (eventDetails) => {
      const element = eventDetails.source.element;
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
    onMoveEnd: () => setMeasurement(null),
  });

  if (!measurement) {
    return <p className={styles.readout}>Drag a card to compare it with its preview.</p>;
  }

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
