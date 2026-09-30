'use client';

import * as React from 'react';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { visuallyHidden } from '@base-ui/utils/visuallyHidden';
import { Draggable } from '@base-ui/react/draggable';
import {
  INITIAL_TASKS,
  moveTask,
  swapTask,
  getTaskRow,
  getTaskDestination,
  sameTaskDestination,
} from '../../sortableTasks';
import type { TaskDestination } from '../../sortableTasks';
import { useSortableAnimation } from '../../useSortableAnimation';

const CONTROL_CLASS =
  'flex h-8 items-center justify-center border border-neutral-950 bg-white px-3 text-sm leading-none whitespace-nowrap text-neutral-950 select-none hover:bg-neutral-100 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-neutral-950 dark:border-white dark:bg-neutral-950 dark:text-white dark:hover:bg-neutral-800 dark:focus-visible:outline-white';

const taskKind = Draggable.createKind<string>('sortable-live-task');

// Memoized with stable handlers, so a reorder only moves DOM nodes instead of
// re-rendering every item on each collision change.
const Task = React.memo(function Task({
  task,
  onSwap,
}: {
  task: string;
  onSwap: (task: string, direction: 'up' | 'down') => void;
}) {
  return (
    <div data-sortable-row>
      <Draggable.Root
        kind={taskKind}
        payload={task}
        collisionElement={getTaskRow}
        data-sortable-item
        render={<button type="button" aria-label={task} />}
        className="box-border min-h-10 w-full cursor-grab select-none border border-neutral-950 bg-white px-4 py-2 text-sm leading-5 text-neutral-950 data-[dragging]:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 dark:border-white dark:bg-neutral-950 dark:text-white"
        modifiers={Draggable.restrictToVerticalAxis}
        aria-keyshortcuts="Alt+ArrowUp Alt+ArrowDown"
        onKeyDown={(event) => {
          if (event.altKey && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
            event.preventDefault();
            onSwap(task, event.key === 'ArrowUp' ? 'up' : 'down');
          }
        }}
      >
        {task}
      </Draggable.Root>
    </div>
  );
});

export default function SortableLive() {
  const [tasks, setTasks] = React.useState(INITIAL_TASKS);
  const [selectedTask, setSelectedTask] = React.useState(INITIAL_TASKS[0]);
  const [announcement, setAnnouncement] = React.useState('');
  const initialOrder = React.useRef(tasks);
  const listRef = useSortableAnimation(tasks);
  const destinationRef = React.useRef<TaskDestination | null>(null);
  const reorder = useStableCallback(
    (eventDetails: Draggable.CollisionProvider.CollisionChangeEventDetails<string>) => {
      const next = getTaskDestination(eventDetails.target);
      const previous = destinationRef.current;
      if (next) {
        const delta =
          eventDetails.location.current.input.clientY -
          eventDetails.location.previous.input.clientY;
        if (delta !== 0) {
          next.placement = delta > 0 ? 'after' : 'before';
        } else if (next.id === previous?.id) {
          next.placement = previous.placement;
        }
      }
      if (sameTaskDestination(next, previous)) {
        return;
      }
      destinationRef.current = next;
      setTasks((current) => moveTask(current, eventDetails, next?.placement));
    },
  );
  const swap = useStableCallback((task: string, direction: 'up' | 'down') => {
    const next = swapTask(tasks, task, direction);
    if (next === tasks) {
      return;
    }
    setTasks(next);
    setAnnouncement(`${task} moved to position ${next.indexOf(task) + 1} of ${next.length}.`);
  });
  return (
    <Draggable.Provider>
      {/* @highlight-start @focus */}
      <Draggable.CollisionProvider
        kind={taskKind}
        onMoveStart={() => {
          initialOrder.current = tasks;
          destinationRef.current = null;
        }}
        onCollisionChange={reorder}
        onMoveEnd={(eventDetails) => {
          if (eventDetails.reason === 'drop') {
            reorder(eventDetails);
          } else {
            setTasks(initialOrder.current);
          }
          destinationRef.current = null;
        }}
      >
        {/* @highlight-end */}
        <div
          ref={listRef}
          className="grid w-80 max-w-full gap-2"
          role="group"
          aria-label="Tasks reordered while dragging"
        >
          {tasks.map((task) => (
            <Task key={task} task={task} onSwap={swap} />
          ))}
        </div>
      </Draggable.CollisionProvider>
      <fieldset className="m-0 flex flex-wrap gap-2 border-0 p-0" style={{ marginTop: '0.75rem' }}>
        <legend className="mb-2 p-0 text-sm leading-5 font-medium text-neutral-950 dark:text-white">
          Move task
        </legend>
        <select
          aria-label="Task"
          className={CONTROL_CLASS}
          value={selectedTask}
          onChange={(event) => setSelectedTask(event.target.value)}
        >
          {tasks.map((task) => (
            <option key={task} value={task}>
              {task}
            </option>
          ))}
        </select>
        <button type="button" className={CONTROL_CLASS} onClick={() => swap(selectedTask, 'up')}>
          Move up
        </button>
        <button type="button" className={CONTROL_CLASS} onClick={() => swap(selectedTask, 'down')}>
          Move down
        </button>
      </fieldset>
      <span role="status" style={visuallyHidden}>
        {announcement}
      </span>
    </Draggable.Provider>
  );
}
