'use client';
import * as React from 'react';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { Draggable } from '@base-ui/react/draggable';
import { INITIAL_TASKS, moveTask, swapTask } from '../../sortableTasks';
import styles from '../sortable.module.css';

const taskKind = Draggable.createKind<string>('sortable-drop-task');

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
    <Draggable.Root
      kind={taskKind}
      payload={task}
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
  );
});

export default function SortableOnDrop() {
  const [tasks, setTasks] = React.useState(INITIAL_TASKS);
  const reorder = useStableCallback((event: Draggable.CollisionProvider.CollisionEvent<string>) => {
    setTasks((current) => moveTask(current, event));
  });
  const swap = useStableCallback((task: string, direction: 'up' | 'down') => {
    setTasks((current) => swapTask(current, task, direction));
  });
  return (
    <Draggable.Provider>
      <Draggable.CollisionProvider kind={taskKind} onMoveEnd={reorder}>
        <div className={styles.Root} role="group" aria-label="Tasks reordered on drop">
          {tasks.map((task) => (
            <Task key={task} task={task} onSwap={swap} />
          ))}
        </div>
      </Draggable.CollisionProvider>
    </Draggable.Provider>
  );
}
