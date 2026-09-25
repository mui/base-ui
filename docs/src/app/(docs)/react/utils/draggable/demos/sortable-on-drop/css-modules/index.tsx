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
import styles from '../sortable.module.css';

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
  const trackSelfDrop = useStableCallback(({ target }: Draggable.Root.MoveStartValue<string>) => {
    setSelfDrop(target?.element === rowRef.current);
  });

  return (
    <div data-sortable-row ref={rowRef} className={styles.Row}>
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
        className={styles.Item}
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
    (
      { target }: Draggable.CollisionProvider.CollisionChangeValue<string>,
      { previousTarget }: Draggable.CollisionProvider.CollisionChangeEventDetails<string>,
    ) => {
      const next = getTaskDestination(target);
      if (sameTaskDestination(next, getTaskDestination(previousTarget))) {
        return;
      }
      setDestination(next);
    },
  );
  const reorder = useStableCallback((value: Draggable.CollisionProvider.MoveEndValue<string>) => {
    setDestination(null);
    setTasks((current) => moveTask(current, value));
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
        <div className={styles.Root} role="group" aria-label="Tasks reordered on drop">
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
