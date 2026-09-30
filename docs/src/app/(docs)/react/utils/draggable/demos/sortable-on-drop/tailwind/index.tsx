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

const CONTROL_CLASS =
  'flex h-8 items-center justify-center border border-neutral-950 bg-white px-3 text-sm leading-none whitespace-nowrap text-neutral-950 select-none hover:bg-neutral-100 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-neutral-950 dark:border-white dark:bg-neutral-950 dark:text-white dark:hover:bg-neutral-800 dark:focus-visible:outline-white';

const taskKind = Draggable.createKind<string>('sortable-drop-task');

// Memoized with stable handlers, so a reorder only moves DOM nodes instead of
// re-rendering every item on each collision change.
const Task = React.memo(function Task({
  task,
  onSwap,
  placement,
}: {
  task: string;
  placement?: TaskDestination['placement'];
  onSwap: (task: string, direction: 'up' | 'down') => void;
}) {
  const rowRef = React.useRef<HTMLDivElement | null>(null);
  const [selfDrop, setSelfDrop] = React.useState(false);
  const trackSelfDrop = useStableCallback(
    (eventDetails: Draggable.Root.TargetChangeEventDetails<string>) => {
      setSelfDrop(eventDetails.target?.element === rowRef.current);
    },
  );

  return (
    <div data-sortable-row ref={rowRef} className="px-[9px] py-1">
      <Draggable.Root
        kind={taskKind}
        payload={task}
        collisionElement={getTaskRow}
        data-drop-position={placement}
        data-self-drop={selfDrop ? '' : undefined}
        onMoveStart={trackSelfDrop}
        onTargetChange={trackSelfDrop}
        onMoveEnd={() => setSelfDrop(false)}
        render={<button type="button" aria-label={task} />}
        className="relative box-border min-h-10 w-full cursor-grab select-none border border-neutral-950 bg-white px-4 py-2 text-sm leading-5 text-neutral-950 after:pointer-events-none after:absolute after:inset-x-[-9px] after:hidden after:h-[3px] after:bg-blue-500 data-[drop-position=before]:after:top-[-6.5px] data-[drop-position=before]:after:block data-[self-drop]:after:top-[-6.5px] data-[self-drop]:after:block data-[drop-position=after]:after:bottom-[-6.5px] data-[drop-position=after]:after:block data-[dragging]:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 dark:border-white dark:bg-neutral-950 dark:text-white"
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

export default function SortableOnDrop() {
  const [tasks, setTasks] = React.useState(INITIAL_TASKS);
  const [selectedTask, setSelectedTask] = React.useState(INITIAL_TASKS[0]);
  const [announcement, setAnnouncement] = React.useState('');
  const [destination, setDestination] = React.useState<TaskDestination | null>(null);
  const trackCollision = useStableCallback(
    (eventDetails: Draggable.CollisionProvider.CollisionChangeEventDetails<string>) => {
      const next = getTaskDestination(eventDetails.target);
      if (sameTaskDestination(next, getTaskDestination(eventDetails.previousTarget))) {
        return;
      }
      setDestination(next);
    },
  );
  const reorder = useStableCallback(
    (eventDetails: Draggable.CollisionProvider.MoveEndEventDetails<string>) => {
      setDestination(null);
      setTasks((current) => moveTask(current, eventDetails));
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
      {/* @highlight-start @focus @padding 1 */}
      <Draggable.CollisionProvider
        kind={taskKind}
        onCollisionChange={trackCollision}
        onMoveEnd={reorder}
      >
        {/* @highlight-end */}
        <div className="grid w-80 max-w-full" role="group" aria-label="Tasks reordered on drop">
          {tasks.map((task) => (
            <Task
              key={task}
              task={task}
              onSwap={swap}
              placement={destination?.id === task ? destination.placement : undefined}
            />
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
