'use client';
import * as React from 'react';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { ownerWindow } from '@base-ui/utils/owner';
import { Draggable } from '@base-ui/react/draggable';
import { DropTarget } from '@base-ui/react/drop-target';

const cardKind = Draggable.createKind<string>('figma-card');
const CARD_WIDTH = 180;
const CARD_HEIGHT = 42;

interface Card {
  id: string;
  x: number;
  y: number;
  label: string;
}

// Positions are fractions of the placeable area (the surface minus one card),
// resolved against the surface's measured size on mount. Fixed pixel
// coordinates were authored for a wide canvas, so on a narrow (mobile) surface
// cards fell off the right edge and — with `overflow: hidden` — out of reach.
const INITIAL_LAYOUT: { id: string; fx: number; fy: number; label: string }[] = [
  { id: 'mercury', fx: 0.04, fy: 0.08, label: 'Mercury' },
  { id: 'venus', fx: 0.5, fy: 0.62, label: 'Venus' },
  { id: 'earth', fx: 0.95, fy: 0.28, label: 'Earth' },
];

// The preview is a clone of the card, so it keeps these classes: `data-dragging`
// hides the source, `data-drag-preview` lifts the clone above the canvas.
const CARD_CLASS =
  'absolute box-border flex items-center border border-neutral-950 bg-white px-3 py-2.5 text-sm leading-5 text-neutral-950 dark:border-white dark:bg-neutral-950 dark:text-white cursor-grab transition-colors data-[dragging]:opacity-0 data-[drag-preview]:shadow-[0.25rem_0.25rem_0_rgb(0_0_0_/_12%)] dark:data-[drag-preview]:shadow-none data-[drag-preview]:data-[drag-mode=keyboard]:outline-2 data-[drag-preview]:data-[drag-mode=keyboard]:-outline-offset-1 data-[drag-preview]:data-[drag-mode=keyboard]:outline-neutral-950 dark:data-[drag-preview]:data-[drag-mode=keyboard]:outline-white hover:bg-neutral-100 dark:hover:bg-neutral-800 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-neutral-950 dark:focus-visible:outline-white';

function BoardCard({
  card,
  surfaceRef,
}: {
  card: Card;
  surfaceRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <Draggable.Root
      label={card.label}
      kind={cardKind}
      payload={card.id}
      // Spell out the default mouse activation for clarity: a drag starts only
      // after a 5px move, so a plain click isn't swallowed. (This matches the
      // engine default, so it can be omitted.)
      pointerActivation={{ mouse: { type: 'distance', distance: 5 } }}
      modifiers={Draggable.restrictToElement(surfaceRef)}
      role="button"
      className={CARD_CLASS}
      style={{ left: card.x, top: card.y, width: CARD_WIDTH, height: CARD_HEIGHT }}
    >
      {card.label}
      <Draggable.ClonedPreview />
    </Draggable.Root>
  );
}

export default function FigmaBoard() {
  const [cards, setCards] = React.useState<Card[]>([]);
  const surfaceRef = React.useRef<HTMLDivElement | null>(null);

  // Resolve the fractional layout against the surface's measured size before
  // paint, then keep the cards inside it as it resizes (a phone rotating, the
  // docs column reflowing) so none can end up off-screen and unreachable.
  useIsoLayoutEffect(() => {
    const surface = surfaceRef.current;
    if (!surface) {
      return undefined;
    }
    const layout = () => {
      const { width, height } = surface.getBoundingClientRect();
      const maxX = Math.max(width - CARD_WIDTH, 0);
      const maxY = Math.max(height - CARD_HEIGHT, 0);
      setCards((prev) =>
        prev.length === 0
          ? INITIAL_LAYOUT.map(({ id, fx, fy, label }) => ({
              id,
              label,
              x: Math.round(fx * maxX),
              y: Math.round(fy * maxY),
            }))
          : // Pull already-placed cards (including ones the user dragged) back
            // inside a surface that has since shrunk.
            prev.map((card) => ({
              ...card,
              x: Math.min(card.x, maxX),
              y: Math.min(card.y, maxY),
            })),
      );
    };
    layout();
    const win = ownerWindow(surface);
    const observer = new win.ResizeObserver(layout);
    observer.observe(surface);
    return () => observer.disconnect();
  }, []);

  // The cards are absolutely positioned with no `z-index`, so DOM order is
  // stacking order: moving the dropped card to the end of the list paints it over
  // the ones it overlaps.
  const moveCard = useStableCallback((id: string, x: number, y: number) => {
    setCards((prev) => {
      const moved = prev.find((card) => card.id === id);
      if (!moved) {
        return prev;
      }
      return [...prev.filter((card) => card.id !== id), { ...moved, x, y }];
    });
  });

  return (
    // Full-bleed: cancel the shared demo playground padding (2rem 1.5rem) so the
    // canvas reaches the demo frame, with no inset gap and no inner border.
    <div className="-mx-6 -my-8 flex w-[calc(100%+3rem)] flex-col gap-4 select-none">
      {/* The whole surface is a drop target, so a release on it counts as a real
          drop rather than a cancel. */}
      <DropTarget.Root
        ref={surfaceRef}
        label="Canvas"
        accept={cardKind}
        trackDragOver={false}
        className="relative box-border h-64 overflow-hidden bg-neutral-50 sm:h-80 bg-[radial-gradient(var(--color-neutral-300)_1px,transparent_1px)] [background-size:20px_20px] dark:bg-neutral-900 dark:bg-[radial-gradient(var(--color-neutral-700)_1px,transparent_1px)]"
        onDrop={({ self, source }) => {
          const surface = surfaceRef.current;
          if (!surface) {
            return;
          }

          // No snap steps are declared, so this is the exact source-anchored point.
          const point = self.getSnappedLocalPoint({ anchor: 'source' });
          const surfaceRect = surface.getBoundingClientRect();
          moveCard(
            source.payload,
            point.x * surfaceRect.width - surface.clientLeft,
            point.y * surfaceRect.height - surface.clientTop,
          );
        }}
      >
        {cards.map((card) => (
          <BoardCard key={card.id} card={card} surfaceRef={surfaceRef} />
        ))}
      </DropTarget.Root>
    </div>
  );
}
