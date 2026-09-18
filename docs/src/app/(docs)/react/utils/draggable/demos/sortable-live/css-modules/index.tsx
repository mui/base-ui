'use client';
import * as React from 'react';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { Draggable } from '@base-ui/react/draggable';
import { INITIAL_TASKS, moveTask, swapTask, getTaskRow } from '../../sortableTasks';
import { useSortableAnimation } from '../../useSortableAnimation';
import styles from '../sortable.module.css';

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

export default function SortableLive() {
  const [tasks, setTasks] = React.useState(INITIAL_TASKS);
  const initialOrder = React.useRef(tasks);
  const listRef = useSortableAnimation(tasks);
  const reorder = useStableCallback((event: Draggable.CollisionProvider.CollisionEvent<string>) => {
    setTasks((current) => moveTask(current, event));
  });
  const swap = useStableCallback((task: string, direction: 'up' | 'down') => {
    setTasks((current) => swapTask(current, task, direction));
  });
  return (
    <Draggable.Provider>
      <Draggable.CollisionProvider
        kind={taskKind}
        placement="direction"
        onMoveStart={() => {
          initialOrder.current = tasks;
        }}
        onCollisionChange={reorder}
        onMoveEnd={(event) => {
          if (event.canceled || !event.dropTarget) {
            setTasks(initialOrder.current);
          } else {
            reorder(event);
          }
        }}
      >
        <div
          ref={listRef}
          className={styles.Root}
          role="group"
          aria-label="Tasks reordered while dragging"
        >
          {tasks.map((task) => (
            <Task key={task} task={task} onSwap={swap} />
          ))}
        </div>
      </Draggable.CollisionProvider>
    </Draggable.Provider>
  );
}
