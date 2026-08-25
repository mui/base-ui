'use client';
import * as React from 'react';
import { Draggable } from '@base-ui/react/draggable';
import { DropTarget } from '@base-ui/react/drop-target';
import { DragAutoScroll } from '@base-ui/react/drag-auto-scroll';

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

const UPCOMING = ['Renew passport', 'Cancel the trial', 'Refill the coffee', 'Label the boxes'];

// Resolve the insertion slot closest to the pointer, including positions outside
// the currently visible portion of the list.
function resolveDrop(container: HTMLElement, clientY: number): { index: number; slotY: number } {
  // The dragged card's preview is a clone and carries the same `data-card`.
  // Skip it: it follows the pointer and is not a real slot.
  const cards = Array.from(
    container.querySelectorAll<HTMLElement>('[data-card]:not([data-drag-preview])'),
  );
  if (cards.length === 0) {
    return { index: 0, slotY: container.getBoundingClientRect().top };
  }

  const slotYs = [cards[0].getBoundingClientRect().top];
  for (let i = 1; i < cards.length; i += 1) {
    const prev = cards[i - 1].getBoundingClientRect();
    const curr = cards[i].getBoundingClientRect();
    slotYs.push((prev.bottom + curr.top) / 2);
  }
  slotYs.push(cards[cards.length - 1].getBoundingClientRect().bottom);

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

function Grip() {
  return (
    <svg
      className="shrink-0 text-neutral-400 dark:text-neutral-500"
      width="8"
      height="14"
      viewBox="0 0 8 14"
      aria-hidden="true"
    >
      <g fill="currentColor">
        <circle cx="2" cy="2" r="1.2" />
        <circle cx="6" cy="2" r="1.2" />
        <circle cx="2" cy="7" r="1.2" />
        <circle cx="6" cy="7" r="1.2" />
        <circle cx="2" cy="12" r="1.2" />
        <circle cx="6" cy="12" r="1.2" />
      </g>
    </svg>
  );
}

// The preview is a clone of the card, so it keeps these classes: `data-dragging`
// dims the source, `data-drag-preview` lifts the clone above the board.
const CARD_CLASS =
  'inline-flex items-center gap-2 box-border border border-neutral-950 bg-white px-2.5 py-1.5 text-sm leading-5 text-neutral-950 dark:border-white dark:bg-neutral-950 dark:text-white cursor-grab transition data-[dragging]:opacity-40 motion-safe:data-[drag-preview]:data-ending-style:transition-[translate] motion-safe:data-[drag-preview]:data-ending-style:duration-200 motion-safe:data-[drag-preview]:data-ending-style:ease-[cubic-bezier(0.2,0,0,1)] data-[drag-preview]:shadow-[0.25rem_0.25rem_0_rgb(0_0_0_/_12%)] dark:data-[drag-preview]:shadow-none hover:bg-neutral-100 dark:hover:bg-neutral-800 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-neutral-950 dark:focus-visible:outline-white';

const LIST_CLASS = 'relative flex min-h-0 flex-1 flex-col items-start gap-1.5 overflow-y-auto';

function Card({ task, draggable }: { task: Task; draggable?: boolean }) {
  if (!draggable) {
    return (
      <div data-card className={CARD_CLASS}>
        <Grip />
        {task.label}
      </div>
    );
  }
  return (
    <Draggable.Root
      kind={taskKind}
      payload={task}
      data-card
      data-id={task.id}
      role="button"
      className={CARD_CLASS}
    >
      <Grip />
      {task.label}
    </Draggable.Root>
  );
}

function DropZone({
  label,
  tasks,
  maxSpeed,
  onInsert,
}: {
  label: string;
  tasks: Task[];
  // Left out on the plain list, so it keeps the engine's default speed.
  maxSpeed?: number;
  onInsert: (task: Task, index: number) => void;
}) {
  const listRef = React.useRef<HTMLDivElement | null>(null);
  // Y offset (in the list's scrolled content) of the line previewing the drop.
  const [dropLineTop, setDropLineTop] = React.useState<number | null>(null);

  const cards = (
    <React.Fragment>
      {tasks.map((task) => (
        <Card key={task.id} task={task} />
      ))}
      {dropLineTop != null && (
        <div
          style={{ top: dropLineTop }}
          className="pointer-events-none absolute inset-x-0 h-0.5 -translate-y-1/2 bg-neutral-950 dark:bg-white"
          aria-hidden="true"
        />
      )}
    </React.Fragment>
  );
  const scrollRegion =
    maxSpeed === undefined ? (
      <div ref={listRef} className={LIST_CLASS}>
        {cards}
      </div>
    ) : (
      // @highlight-start
      <DragAutoScroll.Root ref={listRef} className={LIST_CLASS} maxSpeed={maxSpeed}>
        {cards}
      </DragAutoScroll.Root>
      // @highlight-end
    );

  return (
    <DropTarget.Root
      className="box-border flex h-52 flex-col gap-2 border border-neutral-200 p-3 transition-colors data-[drag-over]:border-neutral-950 data-[drag-over]:bg-neutral-100 dark:border-neutral-700 dark:data-[drag-over]:border-white dark:data-[drag-over]:bg-neutral-800"
      accept={taskKind}
      onDrag={({ location }) => {
        const container = listRef.current;
        if (!container) {
          return;
        }
        const { slotY } = resolveDrop(container, location.current.input.clientY);
        setDropLineTop(slotY - container.getBoundingClientRect().top + container.scrollTop);
      }}
      onDragLeave={() => setDropLineTop(null)}
      onDrop={({ source, location }) => {
        const container = listRef.current;
        if (container) {
          const { index } = resolveDrop(container, location.current.input.clientY);
          onInsert(source.payload, index);
        }
        setDropLineTop(null);
      }}
    >
      <span className="text-[0.75rem] leading-4 font-semibold text-neutral-500 dark:text-neutral-400">
        {label}
      </span>
      {scrollRegion}
    </DropTarget.Root>
  );
}

export default function AutoScrollBoard() {
  const [tasks, setTasks] = React.useState<Record<Zone, Task[]>>(INITIAL_TASKS);
  // Index into `UPCOMING`, so the tray always holds another card to drag.
  const [handedOut, setHandedOut] = React.useState(0);
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  // Id of the card just dropped; scrolled back into view after the commit.
  const droppedIdRef = React.useRef<string | null>(null);

  const pending: Task = {
    id: `new-${handedOut}`,
    label: UPCOMING[handedOut % UPCOMING.length],
  };

  function insert(zone: Zone, task: Task, index: number) {
    droppedIdRef.current = task.id;
    setTasks((prev) => ({
      ...prev,
      [zone]: [...prev[zone].slice(0, index), task, ...prev[zone].slice(index)],
    }));
    setHandedOut((count) => count + 1);
  }

  // The drop can land the card outside the visible window, since the list
  // reflows around it. Reveal it so the insertion is never invisible.
  React.useEffect(() => {
    const id = droppedIdRef.current;
    if (id == null) {
      return;
    }
    droppedIdRef.current = null;
    rootRef.current?.querySelector(`[data-id="${id}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [tasks]);

  return (
    // @highlight-start
    <DragAutoScroll.Provider>
      {/* @highlight-end */}
      <div ref={rootRef} className="flex w-full flex-col gap-4 select-none">
        <p className="m-0 text-sm leading-5 text-neutral-500 dark:text-neutral-400">
          Drag the card into either list, at the slot you want. The provider enables both; only the
          second list configures its region.
        </p>
        <div className="flex items-center gap-3">
          <Card task={pending} draggable />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DropZone
            label="Default"
            tasks={tasks.plain}
            onInsert={(task, index) => insert('plain', task, index)}
          />
          <DropZone
            label="maxSpeed={150}"
            tasks={tasks.slow}
            maxSpeed={150}
            onInsert={(task, index) => insert('slow', task, index)}
          />
        </div>
      </div>
    </DragAutoScroll.Provider>
  );
}
