'use client';
import { Draggable } from '@base-ui/react/draggable';

import * as React from 'react';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { findClosestSlot } from './kanban-placeholder-card-slots';

import styles from './kanban-placeholder-card.module.css';
import controlsStyles from './controls.module.css';

// A "snap to closest position" Kanban board built with `useMonitor`.
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

const cardKind = Draggable.createKind<CardDragPayload>('kanban-card');

interface CardDragPayload {
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

function KanbanBoardContent() {
  const [board, setBoard] = React.useState<Board>(buildInitialBoard);
  const [selectedCard, setSelectedCard] = React.useState('c1');
  const [destination, setDestination] = React.useState('todo');
  const [beforeCard, setBeforeCard] = React.useState('end');
  const [announcement, setAnnouncement] = React.useState('');
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
      setAnnouncement(`${board.cards[cardId].title} moved to ${board.columns[toColumn].title}.`);
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
  Draggable.useMonitor({
    accept: cardKind,
    // @highlight-end
    onMoveStart: ({ source }, { location }) => {
      const { clientX, clientY } = location.current.input;
      const slot = computeSlot(clientX, clientY, columnElementsRef.current);
      setPlaceholder(
        slot ? { ...slot, height: source.element.getBoundingClientRect().height } : null,
      );
    },
    onMove: ({ source }, { location }) => {
      const { clientX, clientY } = location.current.input;
      const slot = computeSlot(clientX, clientY, columnElementsRef.current);
      setPlaceholder(
        slot ? { ...slot, height: source.element.getBoundingClientRect().height } : null,
      );
    },
    // The placeholder always shows the nearest slot, even when the pointer is
    // between columns or just outside the board. Commit that same slot on a real
    // release; an Escape/blur cancellation only clears the placeholder.
    onMoveEnd: ({ source }, { reason, location }) => {
      if (reason === 'drop' || reason === 'outside-release') {
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
    <Draggable.Target className={styles.Root} accept={cardKind} trackDragOver={false}>
      <form
        className={controlsStyles.Controls}
        onSubmit={(event) => {
          event.preventDefault();
          const from = board.columnOrder.find((id) =>
            board.columns[id].cardIds.includes(selectedCard),
          );
          const cards = board.columns[destination].cardIds;
          if (from) {
            moveCard(
              selectedCard,
              from,
              destination,
              beforeCard === 'end' || !cards.includes(beforeCard)
                ? cards.length
                : cards.indexOf(beforeCard),
            );
          }
        }}
      >
        <label>
          Card{' '}
          <select value={selectedCard} onChange={(event) => setSelectedCard(event.target.value)}>
            {Object.values(board.cards).map((card) => (
              <option key={card.id} value={card.id}>
                {card.title}
              </option>
            ))}
          </select>
        </label>
        <label>
          Move to{' '}
          <select
            value={destination}
            onChange={(event) => {
              setDestination(event.target.value);
              setBeforeCard('end');
            }}
          >
            {board.columnOrder.map((id) => (
              <option key={id} value={id}>
                {board.columns[id].title}
              </option>
            ))}
          </select>
        </label>
        <label>
          Position{' '}
          <select
            value={board.columns[destination].cardIds.includes(beforeCard) ? beforeCard : 'end'}
            onChange={(event) => setBeforeCard(event.target.value)}
          >
            <option value="end">At the end</option>
            {board.columns[destination].cardIds.map((id) => (
              <option key={id} value={id}>
                Before {board.cards[id].title}
              </option>
            ))}
          </select>
        </label>
        <button type="submit">Move card</button>
      </form>
      <div role="status" className={controlsStyles.Status}>
        {announcement}
      </div>
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
    </Draggable.Target>
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
    <div
      className={styles.Placeholder}
      data-placeholder
      style={{ height: placeholder.height }}
      aria-hidden="true"
    />
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
  const payload = React.useMemo(() => ({ id: card.id, fromColumn: columnId }), [card.id, columnId]);
  return (
    <Draggable.Root kind={cardKind} payload={payload} data-card className={styles.Card}>
      {card.title}
      <Draggable.Preview />
    </Draggable.Root>
  );
}

export default function KanbanBoard() {
  return (
    <Draggable.Provider>
      <KanbanBoardContent />
    </Draggable.Provider>
  );
}
