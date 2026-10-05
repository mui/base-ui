'use client';
import { Draggable } from '@base-ui/react/draggable';

import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { visuallyHidden } from '@base-ui/utils/visuallyHidden';
import { GripIcon } from '../../GripIcon';
import { DragPageAutoScroll } from '../../DragPageAutoScroll';

type Zone = 'plain' | 'slow';

interface Task {
  id: string;
  label: string;
}

const taskKind = Draggable.createKind<Task>('task');

const INITIAL_TASKS: Record<Zone, Task[]> = {
  plain: [
    { id: 'plants', label: 'Water the plants' },
    { id: 'reply', label: 'Reply to Alex' },
    { id: 'dentist', label: 'Book a dentist' },
    { id: 'invoice', label: 'Send the invoice' },
    { id: 'sprint', label: 'Plan the sprint' },
    { id: 'bank', label: 'Call the bank' },
    { id: 'groceries', label: 'Buy groceries' },
    { id: 'desk', label: 'Clean the desk' },
    { id: 'flights', label: 'Book the flights' },
    { id: 'draft', label: 'Review the draft' },
    { id: 'budget', label: 'Update the budget' },
    { id: 'standup', label: 'Move the standup' },
    { id: 'keys', label: 'Copy the keys' },
    { id: 'photos', label: 'Sort the photos' },
    { id: 'router', label: 'Reboot the router' },
    { id: 'gift', label: 'Wrap the gift' },
  ],
  slow: [
    { id: 'rent', label: 'Pay the rent' },
    { id: 'resume', label: 'Update resume' },
    { id: 'backup', label: 'Back up the laptop' },
    { id: 'docs', label: 'Read the docs' },
    { id: 'bug', label: 'Fix the bug' },
    { id: 'tests', label: 'Write the tests' },
    { id: 'team', label: 'Email the team' },
    { id: 'supplies', label: 'Order supplies' },
    { id: 'changelog', label: 'Write the changelog' },
    { id: 'deps', label: 'Bump the deps' },
    { id: 'flaky', label: 'Fix the flaky test' },
    { id: 'release', label: 'Tag the release' },
    { id: 'metrics', label: 'Check the metrics' },
    { id: 'onboard', label: 'Onboard the intern' },
    { id: 'retro', label: 'Book the retro' },
    { id: 'archive', label: 'Archive the branch' },
  ],
};

const ZONE_LABELS: Record<Zone, string> = { plain: 'Default', slow: 'maxSpeed={150}' };

const UPCOMING = ['Renew passport', 'Cancel the trial', 'Refill the coffee', 'Label the boxes'];

// Find the insertion slot closest to the pointer, including slots scrolled out
// of view.
function resolveDrop(container: HTMLElement, clientY: number): { index: number; slotY: number } {
  // The drag preview is a clone of the card, so it has `data-card` too. Skip it,
  // since it follows the pointer and isn't a real slot.
  const cards = Array.from(
    container.querySelectorAll<HTMLElement>('[data-card]:not([data-drag-preview])'),
  );
  if (cards.length === 0) {
    return { index: 0, slotY: container.getBoundingClientRect().top };
  }

  const rects = cards.map((card) => card.getBoundingClientRect());
  const slotYs = [rects[0].top];
  for (let i = 1; i < rects.length; i += 1) {
    slotYs.push((rects[i - 1].bottom + rects[i].top) / 2);
  }
  slotYs.push(rects[rects.length - 1].bottom);

  let index = 0;
  let bestDy = Infinity;
  for (let i = 0; i < slotYs.length; i += 1) {
    const dy = Math.abs(clientY - slotYs[i]);
    if (dy < bestDy) {
      bestDy = dy;
      index = i;
    }
  }
  return { index, slotY: slotYs[index] };
}

// The preview is a clone of the card, so it keeps these classes: `data-dragging`
// dims the source, `data-drag-preview` lifts the clone above the board.
const CARD_CLASS =
  'inline-flex items-center gap-2 box-border border border-neutral-950 bg-white px-2.5 py-1.5 text-sm leading-5 text-neutral-950 dark:border-white dark:bg-neutral-950 dark:text-white cursor-grab transition-[background-color,opacity] data-[dragging]:opacity-40 motion-safe:data-[drag-preview]:data-ending-style:transition-[translate] motion-safe:data-[drag-preview]:data-ending-style:duration-200 motion-safe:data-[drag-preview]:data-ending-style:ease-[cubic-bezier(0.2,0,0,1)] data-[drag-preview]:shadow-[0.25rem_0.25rem_0_rgb(0_0_0_/_12%)] dark:data-[drag-preview]:shadow-none hover:bg-neutral-100 dark:hover:bg-neutral-800 focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-neutral-950 dark:focus-visible:outline-white';

const LIST_CLASS = 'relative flex min-h-0 flex-1 flex-col items-start gap-1.5 overflow-y-auto';

function Card({
  task,
  draggable,
  onKeyDown,
}: {
  task: Task;
  draggable?: boolean;
  onKeyDown: (event: React.KeyboardEvent<HTMLElement>, task: Task) => void;
}) {
  return (
    <Draggable.Root
      kind={taskKind}
      payload={task}
      previewKey={task.id}
      disabled={!draggable}
      data-card
      data-id={task.id}
      tabIndex={0}
      aria-keyshortcuts="Alt+ArrowLeft Alt+ArrowRight Alt+ArrowUp Alt+ArrowDown"
      onKeyDown={(event) => onKeyDown(event, task)}
      className={CARD_CLASS}
    >
      <GripIcon className="shrink-0 text-neutral-400 dark:text-neutral-500" />
      {task.label}
    </Draggable.Root>
  );
}

function DropZone({
  label,
  tasks,
  maxSpeed,
  onInsert,
  onCardKeyDown,
}: {
  label: string;
  tasks: Task[];
  // Unset on the plain list, which keeps the default auto-scroll speed.
  maxSpeed?: number;
  onInsert: (task: Task, index: number) => void;
  onCardKeyDown: (event: React.KeyboardEvent<HTMLElement>, task: Task) => void;
}) {
  const listRef = React.useRef<HTMLDivElement | null>(null);
  // Y offset of the drop line within the list's scrolled content.
  const [dropLineTop, setDropLineTop] = React.useState<number | null>(null);

  return (
    <Draggable.Target
      className="box-border flex h-52 flex-col gap-2 border border-neutral-200 p-3 transition-colors data-[drag-over]:border-neutral-950 data-[drag-over]:bg-neutral-100 dark:border-neutral-700 dark:data-[drag-over]:border-white dark:data-[drag-over]:bg-neutral-800"
      accept={taskKind}
      onDraggableMove={(eventDetails) => {
        const container = listRef.current;
        if (!container) {
          return;
        }
        const { slotY } = resolveDrop(container, eventDetails.location.current.input.clientY);
        setDropLineTop(slotY - container.getBoundingClientRect().top + container.scrollTop);
      }}
      onDraggableLeave={() => setDropLineTop(null)}
      onDraggableDrop={(eventDetails) => {
        const container = listRef.current;
        if (container) {
          const { index } = resolveDrop(container, eventDetails.location.current.input.clientY);
          onInsert(eventDetails.source.payload, index);
        }
        setDropLineTop(null);
      }}
    >
      <span className="text-[0.75rem] leading-4 font-semibold text-neutral-500 dark:text-neutral-400">
        {label}
      </span>
      {/* @highlight-start @focus */}
      <Draggable.Viewport ref={listRef} className={LIST_CLASS} maxSpeed={maxSpeed}>
        {tasks.map((task) => (
          <Card key={task.id} task={task} onKeyDown={onCardKeyDown} />
        ))}
        {dropLineTop != null && (
          <div
            style={{ top: dropLineTop }}
            className="pointer-events-none absolute inset-x-0 h-0.5 -translate-y-1/2 bg-neutral-950 dark:bg-white"
            aria-hidden="true"
          />
        )}
      </Draggable.Viewport>
      {/* @highlight-end */}
    </Draggable.Target>
  );
}

export default function AutoScrollBoard() {
  const [tasks, setTasks] = React.useState<Record<Zone, Task[]>>(INITIAL_TASKS);
  // Index into `UPCOMING`, so the tray always holds another card to drag.
  const [handedOut, setHandedOut] = React.useState(0);
  const [message, setMessage] = React.useState('');
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  // Id of the card just dropped, so the effect below can scroll it into view.
  const droppedIdRef = React.useRef<string | null>(null);
  const focusMovedCardRef = React.useRef(false);

  const pending: Task = {
    id: `new-${handedOut}`,
    label: UPCOMING[handedOut % UPCOMING.length],
  };

  function insert(zone: Zone, task: Task, index: number, sourceZone?: Zone) {
    droppedIdRef.current = task.id;
    setTasks((current) => {
      const next = { ...current };
      if (sourceZone) {
        next[sourceZone] = next[sourceZone].filter((entry) => entry.id !== task.id);
      }
      next[zone] = [...next[zone].slice(0, index), task, ...next[zone].slice(index)];
      return next;
    });
    if (!sourceZone) {
      setHandedOut((count) => count + 1);
    }
    setMessage(
      `${task.label} ${sourceZone ? 'moved' : 'added'} to ${ZONE_LABELS[zone]} at position ${index + 1}.`,
    );
  }

  function onCardKeyDown(event: React.KeyboardEvent<HTMLElement>, task: Task, zone?: Zone) {
    if (!event.altKey) {
      return;
    }
    let destination = zone;
    let index = zone ? tasks[zone].findIndex((entry) => entry.id === task.id) : 0;
    switch (event.key) {
      case 'ArrowLeft':
        destination = 'plain';
        break;
      case 'ArrowRight':
        destination = 'slow';
        break;
      case 'ArrowUp':
        index -= 1;
        break;
      case 'ArrowDown':
        index += 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    if (
      !destination ||
      (destination === zone &&
        (event.key === 'ArrowLeft' ||
          event.key === 'ArrowRight' ||
          index < 0 ||
          index >= tasks[destination].length))
    ) {
      return;
    }
    index = Math.min(index, tasks[destination].length);
    focusMovedCardRef.current = true;
    insert(destination, task, index, zone);
  }

  // The list reflows around the drop, which can push the new card out of view.
  // Scroll it back into view.
  useIsoLayoutEffect(() => {
    const id = droppedIdRef.current;
    if (id == null) {
      return;
    }
    droppedIdRef.current = null;
    const card = rootRef.current?.querySelector<HTMLElement>(
      `[data-id="${id}"]:not([data-drag-preview])`,
    );
    card?.scrollIntoView({ block: 'nearest' });
    if (focusMovedCardRef.current) {
      focusMovedCardRef.current = false;
      card?.focus();
    }
  }, [tasks]);

  return (
    <Draggable.Provider>
      <DragPageAutoScroll accept={taskKind} />
      <div ref={rootRef} className="flex w-full flex-col gap-4 select-none">
        <p className="m-0 text-sm leading-5 text-neutral-500 dark:text-neutral-400">
          Drag the card into either list, at the slot you want. Both lists scroll near their edges;
          the second list scrolls more slowly.
        </p>
        <div className="flex items-center gap-3">
          <Card key={pending.id} task={pending} draggable onKeyDown={onCardKeyDown} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DropZone
            label={ZONE_LABELS.plain}
            tasks={tasks.plain}
            onInsert={(task, index) => insert('plain', task, index)}
            onCardKeyDown={(event, task) => onCardKeyDown(event, task, 'plain')}
          />
          <DropZone
            label={ZONE_LABELS.slow}
            tasks={tasks.slow}
            maxSpeed={150}
            onInsert={(task, index) => insert('slow', task, index)}
            onCardKeyDown={(event, task) => onCardKeyDown(event, task, 'slow')}
          />
        </div>
        <p role="status" style={visuallyHidden}>
          {message}
        </p>
      </div>
    </Draggable.Provider>
  );
}
