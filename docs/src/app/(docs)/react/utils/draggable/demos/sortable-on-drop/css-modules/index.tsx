'use client';
import * as React from 'react';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
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
  const trackSelfDrop = useStableCallback((event: Draggable.MoveStartEvent<string>) => {
    setSelfDrop(event.location.current.dropTargets[0]?.element === rowRef.current);
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
    setTasks((current) => swapTask(current, task, direction));
  });
  return (
    <Draggable.Provider>
      <Draggable.CollisionProvider
        kind={taskKind}
        onCollisionChange={trackCollision}
        onMoveEnd={reorder}
      >
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
    </Draggable.Provider>
  );
}
