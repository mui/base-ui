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
  const trackSelfDrop = useStableCallback((event: Draggable.MoveStartEvent<string>) => {
    setSelfDrop(event.location.current.dropTargets[0]?.element === rowRef.current);
  });

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
        className="relative box-border min-h-10 w-full cursor-grab select-none border border-neutral-900 bg-white px-4 py-2 text-sm leading-5 text-neutral-900 after:pointer-events-none after:absolute after:inset-x-[-9px] after:hidden after:h-[3px] after:bg-blue-500 data-[drop-position=before]:after:top-[-6.5px] data-[drop-position=before]:after:block data-[self-drop]:after:top-[-6.5px] data-[self-drop]:after:block data-[drop-position=after]:after:bottom-[-6.5px] data-[drop-position=after]:after:block data-[dragging]:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 dark:border-white dark:bg-neutral-950 dark:text-white"
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
  const [announcement, setAnnouncement] = React.useState('');
  const [destination, setDestination] = React.useState<TaskDestination | null>(null);
  const trackCollision = useStableCallback(
    ({ collision, previousCollision }: Draggable.CollisionProvider.CollisionEvent<string>) => {
      const next = getTaskDestination(collision);
      if (sameTaskDestination(next, getTaskDestination(previousCollision))) {
        return;
      }
      setDestination(next);
    },
  );
  const reorder = useStableCallback((event: Draggable.CollisionProvider.CollisionEvent<string>) => {
    setDestination(null);
    setTasks((current) => moveTask(current, event));
  });
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
      <span role="status" aria-live="polite" aria-atomic="true" style={visuallyHidden}>
        {announcement}
      </span>
    </Draggable.Provider>
  );
}
