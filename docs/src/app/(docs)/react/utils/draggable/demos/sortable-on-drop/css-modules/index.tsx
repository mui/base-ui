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
import styles from '../sortable.module.css';
import controlStyles from '../../hero.module.css';

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
      <fieldset className={controlStyles.Controls} style={{ marginTop: '0.75rem' }}>
        <legend className={controlStyles.Legend}>Move task</legend>
        <select
          aria-label="Task"
          className={controlStyles.Button}
          value={selectedTask}
          onChange={(event) => setSelectedTask(event.target.value)}
        >
          {tasks.map((task) => (
            <option key={task} value={task}>
              {task}
            </option>
          ))}
        </select>
        <button
          type="button"
          className={controlStyles.Button}
          onClick={() => swap(selectedTask, 'up')}
        >
          Move up
        </button>
        <button
          type="button"
          className={controlStyles.Button}
          onClick={() => swap(selectedTask, 'down')}
        >
          Move down
        </button>
      </fieldset>
      <span role="status" style={visuallyHidden}>
        {announcement}
      </span>
    </Draggable.Provider>
  );
}
