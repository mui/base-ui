'use client';
import * as React from 'react';
import { Draggable } from '@base-ui/react/draggable';
import { DropTarget } from '@base-ui/react/drop-target';
import { DragAutoScroll } from '@base-ui/react/drag-auto-scroll';
import styles from '../../hero.module.css';

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
    <svg className={styles.Grip} width="8" height="14" viewBox="0 0 8 14" aria-hidden="true">
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

function Card({ task, draggable }: { task: Task; draggable?: boolean }) {
  if (!draggable) {
    return (
      <div data-card className={styles.Card}>
        <Grip />
        {task.label}
      </div>
    );
  }
  return (
    <Draggable.Root
      label={task.label}
      kind={taskKind}
      payload={task}
      data-card
      data-id={task.id}
      role="button"
      className={styles.Card}
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
        <div className={styles.DropLine} style={{ top: dropLineTop }} aria-hidden="true" />
      )}
    </React.Fragment>
  );

  return (
    <DropTarget.Root
      className={styles.Zone}
      label={label}
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
      <span className={styles.Label}>{label}</span>
      {maxSpeed === undefined ? (
        // Nothing declared: the list scrolls because its `overflow` says it can.
        <div ref={listRef} className={styles.Cards}>
          {cards}
        </div>
      ) : (
        // The same list, slowed down.
        <DragAutoScroll.Root ref={listRef} className={styles.Cards} maxSpeed={maxSpeed}>
          {cards}
        </DragAutoScroll.Root>
      )}
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
    <div ref={rootRef} className={styles.Root}>
      <p className={styles.Hint}>
        Drag the card into either list, at the slot you want. Both scroll when you near an edge.
        Only the second one declares anything.
      </p>
      <div className={styles.Tray}>
        <Card task={pending} draggable />
      </div>
      <div className={styles.Columns}>
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
  );
}
