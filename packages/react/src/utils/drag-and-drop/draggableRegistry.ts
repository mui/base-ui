/**
 * Shared registry of draggable elements.
 *
 * The pointer sensor reads from this registry so a draggable is registered once.
 * Routed through `getSharedSlot` so a doubly-bundled engine shares one map.
 */

import { isElement, isHTMLElement } from '@floating-ui/utils/dom';
import { contains } from '@base-ui/utils/shadowDom';
import type { DragCleanupFn } from './types';
import type { DraggableConfig } from './draggable';
import { createGetterStackRegistry } from './getterStackRegistry';
import { getSharedSlot } from './sharedState';
import { getComposedParentElement, resolveElementReference } from './utils';

/** Getter for a single hook's latest draggable parameters, read fresh at gesture start. */
type DraggableGetter = () => DraggableConfig<any, any>;

const holds = createGetterStackRegistry<HTMLElement, DraggableGetter>({
  entries: getSharedSlot('draggableRegistry', () => new WeakMap<HTMLElement, DraggableGetter[]>()),
});

/** Register (or re-register) `element` as a draggable with the given parameters getter. */
export function addDraggableRegistration(
  element: HTMLElement,
  getParameters: DraggableGetter,
): DragCleanupFn {
  return holds.hold(element, getParameters);
}

/** The element's latest parameters getter (last hold wins), or `undefined` when unregistered. */
export function getRegistration(element: HTMLElement): DraggableGetter | undefined {
  return holds.getActive(element);
}

export interface DraggablePickup {
  /** The nearest registered draggable ancestor of the event target. */
  element: HTMLElement;
  /** The resolved event target (inside, or equal to, `element`). */
  target: Element;
  /** The draggable's latest parameters, read fresh at gesture start. */
  parameters: DraggableConfig<any, any>;
  /** The configured drag handle, or `null` when the whole element is draggable. */
  dragHandle: Element | null;
}

/** Resolve the handle that owns pointer pickup. */
export function resolveDragHandle(parameters: DraggableConfig<any, any>): Element | null {
  return resolveElementReference(parameters.handle, undefined);
}

/**
 * Pointer pickup resolution. From a raw event
 * target, find the nearest registered draggable ancestor, read its latest
 * parameters, resolve the drag handle, and enforce the handle-`contains` gate.
 * Returns `null` when the gesture must not start. Callers still run their own
 * `onBeforeMoveStart` dispatch and the lifecycle's `isActive` check.
 */
export function resolveDraggablePickup(rawTarget: EventTarget | null): DraggablePickup | null {
  const target = isElement(rawTarget) ? rawTarget : null;
  if (!target) {
    return null;
  }
  // Walk the registered-draggable ancestor chain (crossing shadow boundaries).
  // The innermost registered draggable may gate pickup on its own drag handle;
  // if the gesture began outside that handle — or the draggable is `disabled` —
  // fall through to an *outer* registered draggable rather than becoming
  // drag-inert — so a nested card inside a draggable list item still starts the
  // outer drag.
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
    // With a configured drag handle, only pick up if the gesture began within
    // it — so an action control elsewhere inside the draggable keeps its own
    // behaviour. A `disabled` draggable can never start a drag, so it is
    // skipped the same way. Otherwise continue from this element's parent.
    // When nothing picks the press up, the sensor arms nothing for it: no
    // contextmenu suppression, and a natively draggable descendant (`<img>`,
    // `<a href>`) keeps its native HTML5 drag. A *dynamic* veto belongs in
    // `onBeforeMoveStart`, dispatched at activation commit.
    if (!parameters.disabled && (!dragHandle || contains(dragHandle, target))) {
      return { element: node, target, parameters, dragHandle };
    }
  }
  return null;
}
