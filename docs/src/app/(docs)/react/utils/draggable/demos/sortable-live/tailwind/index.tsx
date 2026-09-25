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
  type TaskDestination,
} from '../../sortableTasks';
import { useSortableAnimation } from '../../useSortableAnimation';

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
        className="box-border min-h-10 w-full cursor-grab select-none border border-neutral-900 bg-white px-4 py-2 text-sm leading-5 text-neutral-900 data-[dragging]:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 dark:border-white dark:bg-neutral-950 dark:text-white"
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
  const [announcement, setAnnouncement] = React.useState('');
  const initialOrder = React.useRef(tasks);
  const listRef = useSortableAnimation(tasks);
  const destinationRef = React.useRef<TaskDestination | null>(null);
  const reorder = useStableCallback(
    (
      value: Draggable.CollisionProvider.CollisionChangeValue<string>,
      eventDetails: Draggable.CollisionProvider.CollisionChangeEventDetails<string>,
    ) => {
      const next = getTaskDestination(value.target);
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
      setTasks((current) => moveTask(current, value, next?.placement));
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
        onMoveEnd={(value, eventDetails) => {
          if (eventDetails.reason === 'drop') {
            reorder(value, eventDetails);
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
      <span role="status" aria-live="polite" aria-atomic="true" style={visuallyHidden}>
        {announcement}
      </span>
    </Draggable.Provider>
  );
}
