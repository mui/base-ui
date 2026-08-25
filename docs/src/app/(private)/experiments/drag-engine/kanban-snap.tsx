'use client';
import * as React from 'react';
import clsx from 'clsx';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { Draggable } from '@base-ui/react/draggable';
import { useDragMonitor } from '@base-ui/react/use-drag-monitor';
import theme from './theme.module.css';
import styles from './kanban-snap.module.css';

// Demonstrates a Trello-style "snap to closest position" pattern using only
// `useDragMonitor`. The monitor reads the pointer on every drag event and
// resolves two things: the horizontally-closest column, and the vertically-
// closest insertion slot within that column. A line indicator renders at the
// resolved slot. Drops land precisely there, even when the pointer is outside
// every column.

type ColumnId = string;
type CardId = string;

interface Card {
  id: CardId;
  title: string;
}

interface Column {
  id: ColumnId;
  title: string;
  cardIds: CardId[];
}

interface Board {
  columnOrder: ColumnId[];
  columns: Record<ColumnId, Column>;
  cards: Record<CardId, Card>;
}

const cardKind = Draggable.createKind<CardDragData>('kanbanSnap:card');

interface CardDragData {
  id: CardId;
  fromColumn: ColumnId;
}

interface DropIndicator {
  columnId: ColumnId;
  insertIndex: number;
  /** Y offset relative to the target column body, in pixels. */
  top: number;
}

function buildInitialBoard(): Board {
  const columns: Column[] = [
    { id: 'todo', title: 'Todo', cardIds: ['c1', 'c2', 'c3'] },
    { id: 'in-progress', title: 'In progress', cardIds: ['c4', 'c5'] },
    { id: 'review', title: 'Review', cardIds: ['c6'] },
    { id: 'done', title: 'Done', cardIds: ['c7', 'c8'] },
  ];
  const cards: Card[] = [
    { id: 'c1', title: 'Write spec' },
    { id: 'c2', title: 'Sketch UI' },
    { id: 'c3', title: 'Set up project' },
    { id: 'c4', title: 'Wire the API' },
    { id: 'c5', title: 'Build the form' },
    { id: 'c6', title: 'Self review' },
    { id: 'c7', title: 'Ship v0' },
    { id: 'c8', title: 'Tell the team' },
  ];
  return {
    columnOrder: columns.map((c) => c.id),
    columns: Object.fromEntries(columns.map((c) => [c.id, c])),
    cards: Object.fromEntries(cards.map((c) => [c.id, c])),
  };
}

function findClosestColumn(clientX: number, elements: Map<ColumnId, HTMLElement>): ColumnId | null {
  let bestId: ColumnId | null = null;
  let bestDx = Infinity;
  for (const [id, el] of elements) {
    const rect = el.getBoundingClientRect();
    const center = rect.left + rect.width / 2;
    const dx = Math.abs(clientX - center);
    if (dx < bestDx) {
      bestDx = dx;
      bestId = id;
    }
  }
  return bestId;
}

// Within a column, the candidate insertion slots are:
//   index 0           — above the first card
//   index 1..n-1      — between consecutive cards (midpoint of the gap)
//   index n           — below the last card
// For empty columns the only slot is the body's top edge.
function computeSlotYs(columnEl: HTMLElement): number[] {
  const body = columnEl.querySelector('[data-column-body]') as HTMLElement | null;
  const scope = body ?? columnEl;
  const cardEls = Array.from(scope.querySelectorAll('[data-card]')) as HTMLElement[];

  if (cardEls.length === 0) {
    return [scope.getBoundingClientRect().top];
  }

  const slotYs: number[] = [cardEls[0].getBoundingClientRect().top];
  for (let i = 1; i < cardEls.length; i += 1) {
    const prev = cardEls[i - 1].getBoundingClientRect();
    const curr = cardEls[i].getBoundingClientRect();
    slotYs.push((prev.bottom + curr.top) / 2);
  }
  slotYs.push(cardEls[cardEls.length - 1].getBoundingClientRect().bottom);
  return slotYs;
}

/** The slot whose Y is closest to the pointer. */
function findClosestSlot(slotYs: number[], clientY: number): { index: number; slotY: number } {
  let bestIndex = 0;
  let bestDy = Infinity;
  for (let i = 0; i < slotYs.length; i += 1) {
    const dy = Math.abs(clientY - slotYs[i]);
    if (dy < bestDy) {
      bestDy = dy;
      bestIndex = i;
    }
  }
  return { index: bestIndex, slotY: slotYs[bestIndex] };
}

function computeIndicator(
  clientX: number,
  clientY: number,
  columnElements: Map<ColumnId, HTMLElement>,
): DropIndicator | null {
  const columnId = findClosestColumn(clientX, columnElements);
  if (!columnId) {
    return null;
  }
  const columnEl = columnElements.get(columnId);
  if (!columnEl) {
    return null;
  }
  const body = columnEl.querySelector('[data-column-body]') as HTMLElement | null;
  if (!body) {
    return null;
  }
  const bodyTop = body.getBoundingClientRect().top;
  const { index, slotY } = findClosestSlot(computeSlotYs(columnEl), clientY);
  return { columnId, insertIndex: index, top: slotY - bodyTop };
}

export default function KanbanSnap() {
  const [board, setBoard] = React.useState<Board>(buildInitialBoard);
  const [indicator, setIndicator] = React.useState<DropIndicator | null>(null);

  const columnElementsRef = React.useRef<Map<ColumnId, HTMLElement>>(new Map());
  // The board element every card preview is constrained to: drag past its edge
  // and the preview sticks to the edge instead of trailing off the board.
  const boardRef = React.useRef<HTMLDivElement | null>(null);

  const registerColumnElement = useStableCallback((id: ColumnId, el: HTMLElement | null) => {
    if (el) {
      columnElementsRef.current.set(id, el);
    } else {
      columnElementsRef.current.delete(id);
    }
  });

  const moveCard = useStableCallback(
    (cardId: CardId, fromColumn: ColumnId, toColumn: ColumnId, insertIndex: number) => {
      setBoard((prev) => {
        const from = prev.columns[fromColumn];
        const to = prev.columns[toColumn];
        if (!from || !to) {
          return prev;
        }

        if (fromColumn === toColumn) {
          const sourceIndex = from.cardIds.indexOf(cardId);
          // Dropping immediately before or after the source position is a no-op.
          if (
            sourceIndex === -1 ||
            insertIndex === sourceIndex ||
            insertIndex === sourceIndex + 1
          ) {
            return prev;
          }
          const without = from.cardIds.filter((id) => id !== cardId);
          // The removal shifts indices above the source down by one.
          const adjusted = sourceIndex < insertIndex ? insertIndex - 1 : insertIndex;
          const newIds = [...without.slice(0, adjusted), cardId, ...without.slice(adjusted)];
          return {
            ...prev,
            columns: { ...prev.columns, [fromColumn]: { ...from, cardIds: newIds } },
          };
        }

        const newFromIds = from.cardIds.filter((id) => id !== cardId);
        const newToIds = [
          ...to.cardIds.slice(0, insertIndex),
          cardId,
          ...to.cardIds.slice(insertIndex),
        ];
        return {
          ...prev,
          columns: {
            ...prev.columns,
            [fromColumn]: { ...from, cardIds: newFromIds },
            [toColumn]: { ...to, cardIds: newToIds },
          },
        };
      });
    },
  );

  useDragMonitor({
    accept: cardKind,
    onDragStart: ({ location }) => {
      const { clientX, clientY } = location.current.input;
      setIndicator(computeIndicator(clientX, clientY, columnElementsRef.current));
    },
    onDrag: ({ location }) => {
      const { clientX, clientY } = location.current.input;
      setIndicator(computeIndicator(clientX, clientY, columnElementsRef.current));
    },
    onDragEnd: ({ source, location, canceled }) => {
      if (!canceled) {
        const { clientX, clientY } = location.current.input;
        const drop = computeIndicator(clientX, clientY, columnElementsRef.current);
        if (drop) {
          moveCard(source.payload.id, source.payload.fromColumn, drop.columnId, drop.insertIndex);
        }
      }
      setIndicator(null);
    },
  });

  return (
    <div className={clsx(theme.tokens, styles.root)}>
      <header>
        <h1 className={styles.title}>Snap-to-closest position</h1>
        <p className={styles.subtitle}>
          Drag a card anywhere on this page. The line shows exactly where it will land — the closest
          column on the X axis, the closest slot on the Y axis.
        </p>
      </header>

      <div ref={boardRef} className={styles.board}>
        {board.columnOrder.map((id) => {
          const column = board.columns[id];
          return (
            <KanbanColumn
              key={id}
              column={column}
              cards={column.cardIds.map((cardId) => board.cards[cardId])}
              indicator={indicator?.columnId === id ? indicator : null}
              registerElement={registerColumnElement}
              boundaryRef={boardRef}
            />
          );
        })}
      </div>
    </div>
  );
}

function KanbanColumn({
  column,
  cards,
  indicator,
  registerElement,
  boundaryRef,
}: {
  column: Column;
  cards: Card[];
  indicator: DropIndicator | null;
  registerElement: (id: ColumnId, el: HTMLElement | null) => void;
  boundaryRef: React.RefObject<HTMLDivElement | null>;
}) {
  const setRef = React.useCallback(
    (el: HTMLDivElement | null) => {
      registerElement(column.id, el);
    },
    [column.id, registerElement],
  );

  return (
    <div ref={setRef} className={clsx(styles.column, indicator && styles.columnActive)}>
      <div className={styles.columnHeader}>{column.title}</div>
      <div className={styles.columnBody} data-column-body>
        {cards.map((card) => (
          <DraggableCard key={card.id} card={card} columnId={column.id} boundaryRef={boundaryRef} />
        ))}
        {cards.length === 0 && <div className={styles.emptyHint}>(empty)</div>}
        {indicator && (
          <div className={styles.dropLine} style={{ top: indicator.top }} aria-hidden="true" />
        )}
      </div>
    </div>
  );
}

function DraggableCard({
  card,
  columnId,
  boundaryRef,
}: {
  card: Card;
  columnId: ColumnId;
  boundaryRef: React.RefObject<HTMLDivElement | null>;
}) {
  // No preview code: the engine clones the card, so the preview is the card
  // itself (`.card[data-drag-preview]` only deepens its shadow), lifted from the
  // grab point.
  return (
    <Draggable.Root
      kind={cardKind}
      payload={{ id: card.id, fromColumn: columnId }}
      data-card
      role="button"
      tabIndex={0}
      className={(state) => clsx(styles.card, state.dragging && styles.cardDragging)}
    >
      {card.title}
      {/* Constrain the preview to the board container: drag past an edge and the
          preview pins to it instead of trailing off the board. */}
      <Draggable.ClonedPreview modifiers={Draggable.restrictToElement(boundaryRef)} />
    </Draggable.Root>
  );
}
