import { closest } from '@base-ui/utils/shadowDom';
import type { Draggable } from '@base-ui/react/draggable';

export const INITIAL_TASKS = ['Write the spec', 'Sketch the UI', 'Set up the repo', 'Wire the API'];

/** Move the dragged task next to the item under the pointer; unchanged input returns `current`. */
export function moveTask(
  current: string[],
  { source, target }: Draggable.CollisionProvider.CollisionChangeValue<string>,
  placement = target && (target.getLocalPoint().y > 0.5 ? 'after' : 'before'),
): string[] {
  if (!target) {
    return current;
  }
  const remaining = current.filter((task) => task !== source.payload);
  const index = remaining.indexOf(target.payload);
  if (index === -1) {
    return current;
  }
  remaining.splice(index + (placement === 'after' ? 1 : 0), 0, source.payload);
  return remaining.every((task, position) => task === current[position]) ? current : remaining;
}

/** Swap a task with its neighbor for the keyboard alternative. */
export function swapTask(current: string[], task: string, direction: 'up' | 'down'): string[] {
  const index = current.indexOf(task);
  const nextIndex = index + (direction === 'up' ? -1 : 1);
  if (nextIndex < 0 || nextIndex >= current.length) {
    return current;
  }
  const next = [...current];
  [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
  return next;
}

/** Resolve the layout row before React has attached the wrapper's ref. */
export function getTaskRow(element: HTMLElement): HTMLElement {
  return closest<HTMLElement>(element, '[data-sortable-row]')!;
}

export interface TaskDestination {
  id: string;
  placement: 'before' | 'after';
}

export function getTaskDestination(
  target: Draggable.Target.Record<string> | null,
): TaskDestination | null {
  return target
    ? {
        id: target.payload,
        placement: target.getLocalPoint().y > 0.5 ? 'after' : 'before',
      }
    : null;
}

export function sameTaskDestination(a: TaskDestination | null, b: TaskDestination | null): boolean {
  return a?.id === b?.id && a?.placement === b?.placement;
}
