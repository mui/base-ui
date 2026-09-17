'use client';
import * as React from 'react';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { Draggable } from '@base-ui/react/draggable';

const taskKind = Draggable.createKind<string>('sortable-drop-task');
const initialTasks = ['Write the spec', 'Sketch the UI', 'Set up the repo', 'Wire the API'];

export default function SortableOnDrop() {
  const [tasks, setTasks] = React.useState(initialTasks);
  const reorder = useStableCallback(
    ({ source, collision }: Draggable.CollisionProvider.CollisionEvent<string>) => {
      if (!collision) {
        return;
      }
      setTasks((current) => {
        const remaining = current.filter((task) => task !== source.payload);
        const index = remaining.indexOf(collision.target.payload);
        if (index === -1) {
          return current;
        }
        remaining.splice(index + (collision.placement === 'after' ? 1 : 0), 0, source.payload);
        return remaining.every((task, position) => task === current[position])
          ? current
          : remaining;
      });
    },
  );
  return (
    <Draggable.Provider>
      <Draggable.CollisionProvider kind={taskKind} onMoveEnd={reorder}>
        <div
          className="grid w-80 max-w-full gap-2"
          role="group"
          aria-label="Tasks reordered on drop"
        >
          {tasks.map((task) => (
            <Draggable.Root
              key={task}
              kind={taskKind}
              payload={task}
              render={<button type="button" aria-label={task} />}
              className="box-border min-h-10 cursor-grab select-none border border-neutral-900 bg-white px-4 py-2 text-sm leading-5 text-neutral-900 data-[collision-before]:shadow-[inset_0_3px_currentColor] data-[collision-after]:shadow-[inset_0_-3px_currentColor] data-[dragging]:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 dark:border-white dark:bg-neutral-900 dark:text-white"
              modifiers={Draggable.restrictToVerticalAxis}
              aria-keyshortcuts="Alt+ArrowUp Alt+ArrowDown"
              onKeyDown={(event) => {
                if (event.altKey && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
                  event.preventDefault();
                  setTasks((current) => {
                    const index = current.indexOf(task);
                    const nextIndex = index + (event.key === 'ArrowUp' ? -1 : 1);
                    if (nextIndex < 0 || nextIndex >= current.length) {
                      return current;
                    }
                    const next = [...current];
                    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
                    return next;
                  });
                }
              }}
            >
              {task}
            </Draggable.Root>
          ))}
        </div>
      </Draggable.CollisionProvider>
    </Draggable.Provider>
  );
}
