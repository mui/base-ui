import { onTestFinished } from 'vitest';
import { getTarget } from '@base-ui/utils/shadowDom';

/** Records transitions before an interaction, even if they finish before the next assertion. */
export function recordTransitions(
  element: HTMLElement,
  { subtree = false, pause = false }: { subtree?: boolean; pause?: boolean } = {},
) {
  const started: string[] = [];
  const finished: string[] = [];
  const canceled: string[] = [];

  function record(event: TransitionEvent) {
    if (!subtree && getTarget(event) !== element) {
      return;
    }
    if (event.type === 'transitionrun') {
      started.push(event.propertyName);
      if (pause) {
        element.getAnimations({ subtree }).forEach((animation) => animation.pause());
      }
    } else if (event.type === 'transitionend') {
      finished.push(event.propertyName);
    } else {
      canceled.push(event.propertyName);
    }
  }

  function stop() {
    element.removeEventListener('transitionrun', record);
    element.removeEventListener('transitionend', record);
    element.removeEventListener('transitioncancel', record);
  }

  element.addEventListener('transitionrun', record);
  element.addEventListener('transitionend', record);
  element.addEventListener('transitioncancel', record);
  onTestFinished(stop);

  return { started, finished, canceled, stop };
}
