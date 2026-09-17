'use client';
import * as React from 'react';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { Draggable } from '@base-ui/react/draggable';
import styles from '../sortable.module.css';

const taskKind = Draggable.createKind<string>('sortable-task');
const initialTasks = ['Write the spec', 'Sketch the UI', 'Set up the repo', 'Wire the API'];

export default function SortableList() {
  const [tasks, setTasks] = React.useState(initialTasks);
  const [mode, setMode] = React.useState<'drop' | 'live'>('drop');
  const initialOrder = React.useRef(tasks);
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
      <label className={styles.Controls}>
        Reorder
        <select
          value={mode}
          onChange={(event) => setMode(event.target.value === 'live' ? 'live' : 'drop')}
        >
          <option value="drop">On drop</option>
          <option value="live">While dragging</option>
        </select>
      </label>
      <Draggable.CollisionProvider
        kind={taskKind}
        placement={mode === 'live' ? 'direction' : 'midpoint'}
        onMoveStart={() => {
          initialOrder.current = tasks;
        }}
        onCollisionChange={(event) => {
          if (mode === 'live') {
            reorder(event);
          }
        }}
        onMoveEnd={(event) => {
          if (event.canceled || !event.dropTarget) {
            setTasks(initialOrder.current);
          } else {
            reorder(event);
          }
        }}
      >
        <div className={styles.Root} role="group" aria-label="Tasks">
          {tasks.map((task) => (
            <Draggable.Root
              key={task}
              kind={taskKind}
              payload={task}
              render={<button type="button" aria-label={task} />}
              className={styles.Item}
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
