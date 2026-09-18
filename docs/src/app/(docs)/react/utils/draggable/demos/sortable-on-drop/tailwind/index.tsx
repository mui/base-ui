'use client';
import * as React from 'react';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { Draggable } from '@base-ui/react/draggable';
import { INITIAL_TASKS, moveTask, swapTask } from '../../sortableTasks';

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
      className="relative box-border min-h-10 cursor-grab select-none border border-neutral-900 bg-white px-4 py-2 text-sm leading-5 text-neutral-900 after:pointer-events-none after:absolute after:inset-x-[-9px] after:hidden after:h-[3px] after:bg-blue-500 data-[collision-before]:after:top-[-6.5px] data-[collision-before]:after:block data-[collision-after]:after:bottom-[-6.5px] data-[collision-after]:after:block data-[dragging]:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 dark:border-white dark:bg-neutral-950 dark:text-white"
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
        <div
          className="grid w-80 max-w-full gap-2"
          role="group"
          aria-label="Tasks reordered on drop"
        >
          {tasks.map((task) => (
            <Task key={task} task={task} onSwap={swap} />
          ))}
        </div>
      </Draggable.CollisionProvider>
    </Draggable.Provider>
  );
}
