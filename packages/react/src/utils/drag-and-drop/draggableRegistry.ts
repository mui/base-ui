/**
 * Registry of draggable elements.
 *
 * The pointer sensor looks up the pressed draggable here at pickup. The map lives
 * in a `getSharedSlot`, so two bundled copies of the engine share it.
 */

import { isElement, isHTMLElement } from '@floating-ui/utils/dom';
import { contains } from '@base-ui/utils/shadowDom';
import type { DragCleanupFn } from './types';
import type { DraggableConfig } from './draggable';
import { createGetterStackRegistry } from './getterStackRegistry';
import { getSharedSlot } from './sharedState';
import { getComposedParentElement, resolveElementReference } from './utils';

/** Returns one registration's latest draggable parameters. Read at gesture start. */
type DraggableGetter = () => DraggableConfig<any, any>;

const holds = createGetterStackRegistry<HTMLElement, DraggableGetter>({
  entries: getSharedSlot('draggableRegistry', () => new WeakMap<HTMLElement, DraggableGetter[]>()),
});

/** Registers `element` as a draggable. Returns the cleanup that releases this hold. */
export function addDraggableRegistration(
  element: HTMLElement,
  getParameters: DraggableGetter,
): DragCleanupFn {
  return holds.hold(element, getParameters);
}

/** The element's last registered parameters getter, or `undefined` when it isn't registered. */
export function getRegistration(element: HTMLElement): DraggableGetter | undefined {
  return holds.getActive(element);
}

export interface DraggablePickup {
  /** The nearest registered draggable ancestor of the event target. */
  element: HTMLElement;
  /** The event target as an element. It is `element` or one of its descendants. */
  target: Element;
  /** The draggable's latest parameters, read at gesture start. */
  parameters: DraggableConfig<any, any>;
  /** The configured drag handle, or `null` when the whole element is draggable. */
  dragHandle: Element | null;
}

/** Resolves the configured drag handle element, or `null` when there is none. */
export function resolveDragHandle(parameters: DraggableConfig<any, any>): Element | null {
  return resolveElementReference(parameters.handle, undefined);
}

/**
 * Resolves the draggable a press picks up. Starting from the event target, finds
 * the nearest registered draggable ancestor that isn't `disabled` and whose drag
 * handle, if any, contains the target. Returns `null` when none qualifies. Callers
 * still dispatch `onBeforeMoveStart` and check the lifecycle's `isActive`.
 */
export function resolveDraggablePickup(rawTarget: EventTarget | null): DraggablePickup | null {
  const target = isElement(rawTarget) ? rawTarget : null;
  if (!target) {
    return null;
  }
  // Walk up the ancestors, crossing shadow boundaries. When the press began
  // outside the innermost draggable's handle, or that draggable is `disabled`,
  // fall through to an outer registered draggable. A nested card inside a
  // draggable list item then still starts the outer drag.
  for (let node: Element | null = target; node !== null; node = getComposedParentElement(node)) {
    if (!isHTMLElement(node)) {
      continue;
    }
    const getParameters = holds.getActive(node);
    if (getParameters === undefined) {
      continue;
    }
    const parameters = getParameters();
    const dragHandle = resolveDragHandle(parameters);
    // With a drag handle, pick up only a press that began inside it, so controls
    // elsewhere in the draggable keep their own behavior. A `disabled` draggable
    // is skipped the same way. Otherwise continue from this element's parent.
    // When nothing picks the press up, the sensor arms nothing for it. The
    // context menu isn't suppressed, and a natively draggable descendant such as
    // `<img>` or `<a href>` keeps its HTML5 drag. A veto that depends on runtime
    // state belongs in `onBeforeMoveStart`, which runs when activation commits.
    if (!parameters.disabled && (!dragHandle || contains(dragHandle, target))) {
      return { element: node, target, parameters, dragHandle };
    }
  }
  return null;
}
