'use client';
import * as React from 'react';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { Draggable } from '@base-ui/react/draggable';
import { DropTarget } from '@base-ui/react/drop-target';
import { useDragMonitor } from '@base-ui/react/use-drag-monitor';
import styles from '../../kanban.module.css';

// A "snap to closest position" Kanban board built with `useDragMonitor`.
// The monitor reads the pointer on every drag event and resolves the
// horizontally-closest column and the vertically-closest insertion slot within
// it. An empty placeholder card renders in that slot, so the cards part to make
// room and drops land precisely there — even when the pointer is between
// columns.

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

const cardKind = Draggable.createKind<CardDragData>('kanban-card');

interface CardDragData {
  id: CardId;
  fromColumn: ColumnId;
}

interface DropPlaceholder {
  columnId: ColumnId;
  insertIndex: number;
  /** Height of the dragged card, so the placeholder occupies the same space. */
  height: number;
}

function buildInitialBoard(): Board {
  const columns: Column[] = [
    { id: 'todo', title: 'Todo', cardIds: ['c1', 'c2', 'c3'] },
    { id: 'in-progress', title: 'In progress', cardIds: ['c4', 'c5'] },
    { id: 'done', title: 'Done', cardIds: ['c6'] },
  ];
  const cards: Card[] = [
    { id: 'c1', title: 'Write the spec' },
    { id: 'c2', title: 'Sketch the UI' },
    { id: 'c3', title: 'Set up the repo' },
    { id: 'c4', title: 'Wire the API' },
    { id: 'c5', title: 'Build the form' },
    { id: 'c6', title: 'Ship v0' },
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
//   index 0      — above the first card
//   index 1..n-1 — between consecutive cards (midpoint of the gap)
//   index n      — below the last card
// Returns the slot whose Y is closest to the pointer. The rendered placeholder
// carries no `data-card`, so the gap it widens keeps resolving to the same slot
// and the result is stable while the pointer rests over the placeholder.
function findClosestSlot(columnEl: HTMLElement, clientY: number): number {
  const body = columnEl.querySelector('[data-column-body]') as HTMLElement | null;
  const scope = body ?? columnEl;
  // The dragged card's preview is a clone injected next to it, and it carries the
  // same `data-card`. Skip it: it follows the pointer and is not a real slot.
  const cardEls = Array.from(
    scope.querySelectorAll('[data-card]:not([data-drag-preview])'),
  ) as HTMLElement[];

  if (cardEls.length === 0) {
    return 0;
  }

  const slotYs: number[] = [cardEls[0].getBoundingClientRect().top];
  for (let i = 1; i < cardEls.length; i += 1) {
    const prev = cardEls[i - 1].getBoundingClientRect();
    const curr = cardEls[i].getBoundingClientRect();
    slotYs.push((prev.bottom + curr.top) / 2);
  }
  slotYs.push(cardEls[cardEls.length - 1].getBoundingClientRect().bottom);

  let bestIndex = 0;
  let bestDy = Infinity;
  for (let i = 0; i < slotYs.length; i += 1) {
    const dy = Math.abs(clientY - slotYs[i]);
    if (dy < bestDy) {
      bestDy = dy;
      bestIndex = i;
    }
  }
  return bestIndex;
}

function computeSlot(
  clientX: number,
  clientY: number,
  columnElements: Map<ColumnId, HTMLElement>,
): Omit<DropPlaceholder, 'height'> | null {
  const columnId = findClosestColumn(clientX, columnElements);
  if (!columnId) {
    return null;
  }
  const columnEl = columnElements.get(columnId);
  if (!columnEl) {
    return null;
  }
  return { columnId, insertIndex: findClosestSlot(columnEl, clientY) };
}

export default function KanbanBoard() {
  const [board, setBoard] = React.useState<Board>(buildInitialBoard);
  const [placeholder, setPlaceholder] = React.useState<DropPlaceholder | null>(null);

  const columnElementsRef = React.useRef<Map<ColumnId, HTMLElement>>(new Map());

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

  // @highlight-start
  useDragMonitor({
    accept: cardKind,
    // @highlight-end
    onDragStart: ({ source, location }) => {
      const { clientX, clientY } = location.current.input;
      const slot = computeSlot(clientX, clientY, columnElementsRef.current);
      setPlaceholder(
        slot ? { ...slot, height: source.element.getBoundingClientRect().height } : null,
      );
    },
    onDrag: ({ source, location }) => {
      const { clientX, clientY } = location.current.input;
      const slot = computeSlot(clientX, clientY, columnElementsRef.current);
      setPlaceholder(
        slot ? { ...slot, height: source.element.getBoundingClientRect().height } : null,
      );
    },
    // The placeholder always shows the nearest slot, even when the pointer is
    // between columns or just outside the board. Commit that same slot on a real
    // release; an Escape/blur cancellation only clears the placeholder.
    onDragEnd: ({ source, location, canceled }) => {
      if (!canceled) {
        const { clientX, clientY } = location.current.input;
        const drop = computeSlot(clientX, clientY, columnElementsRef.current);
        if (drop) {
          moveCard(source.payload.id, source.payload.fromColumn, drop.columnId, drop.insertIndex);
        }
      }
      setPlaceholder(null);
    },
  });

  return (
    // Catch-all drop target on the demo root, so a release anywhere inside the
    // demo lands on a registered target rather than falling outside every one.
    <DropTarget.Root className={styles.Root} label="Board" accept={cardKind} trackDragOver={false}>
      <div className={styles.Board}>
        {board.columnOrder.map((id) => {
          const column = board.columns[id];
          return (
            <KanbanColumn
              key={id}
              column={column}
              cards={column.cardIds.map((cardId) => board.cards[cardId])}
              placeholder={placeholder?.columnId === id ? placeholder : null}
              registerElement={registerColumnElement}
            />
          );
        })}
      </div>
    </DropTarget.Root>
  );
}

function KanbanColumn({
  column,
  cards,
  placeholder,
  registerElement,
}: {
  column: Column;
  cards: Card[];
  placeholder: DropPlaceholder | null;
  registerElement: (id: ColumnId, el: HTMLElement | null) => void;
}) {
  const setRef = React.useCallback(
    (el: HTMLDivElement | null) => {
      registerElement(column.id, el);
    },
    [column.id, registerElement],
  );

  const ghost = placeholder && (
    <div className={styles.Placeholder} style={{ height: placeholder.height }} aria-hidden="true" />
  );

  return (
    <div ref={setRef} className={styles.Column} data-active={placeholder ? '' : undefined}>
      <div className={styles.ColumnHeader}>{column.title}</div>
      <div className={styles.ColumnBody} data-column-body>
        {placeholder?.insertIndex === 0 && ghost}
        {cards.map((card, index) => (
          <React.Fragment key={card.id}>
            <DraggableCard card={card} columnId={column.id} />
            {placeholder?.insertIndex === index + 1 && ghost}
          </React.Fragment>
        ))}
        {cards.length === 0 && !placeholder && <div className={styles.Empty}>Drop a card here</div>}
      </div>
    </div>
  );
}

function DraggableCard({ card, columnId }: { card: Card; columnId: ColumnId }) {
  return (
    <Draggable.Root
      label={card.title}
      kind={cardKind}
      payload={{ id: card.id, fromColumn: columnId }}
      data-card
      role="button"
      className={styles.Card}
    >
      {card.title}
      <Draggable.ClonedPreview />
    </Draggable.Root>
  );
}
