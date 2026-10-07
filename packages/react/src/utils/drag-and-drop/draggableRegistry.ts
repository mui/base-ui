/** Registry of draggable elements, which the pointer sensor looks up at pickup. */

import { isElement, isHTMLElement } from '@floating-ui/utils/dom';
import type { DragCleanupFn } from './types';
import type { DraggableConfig } from './draggable';
import { createGetterStackRegistry } from './getterStackRegistry';
import { hasInteractiveAncestorWithin } from './interactiveElement';
import { getSharedSlot } from './sharedState';
import { getComposedParentElement, resolveElementReference } from './utils';
import { getClosedShadowRootsByHost } from './dropTarget';

type DraggableGetter = () => DraggableConfig<any, any>;

interface DraggableRegistration {
  getParameters: DraggableGetter;
  /** Re-applies this registration's static setup from the element's active parameters. */
  refreshStaticSetup: (parameters: DraggableConfig<any, any>) => void;
}

/**
 * Each entry is a stack because merged refs can put two registrations on one
 * node. The last one is active.
 */
const registrations = getSharedSlot(
  'draggableRegistry',
  () => new WeakMap<HTMLElement, DraggableRegistration[]>(),
);

const holds = createGetterStackRegistry<HTMLElement, DraggableRegistration>({
  entries: registrations,
});

/** `refreshStaticSetup` runs on each press inside `element` (see `resolveDraggablePickup`). */
export function addDraggableRegistration(
  element: HTMLElement,
  getParameters: DraggableGetter,
  refreshStaticSetup: DraggableRegistration['refreshStaticSetup'],
): DragCleanupFn {
  return holds.hold(element, { getParameters, refreshStaticSetup });
}

export function getRegistration(element: HTMLElement): DraggableGetter | undefined {
  return holds.getActive(element)?.getParameters;
}

/**
 * Re-apply the static setup of every registration on `element` from the active
 * parameters, and return them. `undefined` when the element isn't registered.
 */
export function refreshDraggableStaticSetup(
  element: HTMLElement,
): DraggableConfig<any, any> | undefined {
  const stack = registrations.get(element);
  if (stack === undefined || stack.length === 0) {
    return undefined;
  }
  const parameters = stack[stack.length - 1].getParameters();
  // Copy first, since a refresh can re-register and mutate the stack.
  for (const registration of [...stack]) {
    registration.refreshStaticSetup(parameters);
  }
  return parameters;
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

export function resolveDragHandle(
  parameters: Pick<DraggableConfig<any, any>, 'handle'>,
): Element | null {
  return resolveElementReference(parameters.handle, undefined);
}

/**
 * Whether the draggable accepts a press on `target`: it isn't `disabled`, and the
 * press began inside its handle, if any. The check walks the composed tree, so
 * content slotted into a handle counts as inside it.
 */
function acceptsPress(pickup: Omit<DraggablePickup, 'element'>): boolean {
  if (pickup.parameters.disabled) {
    return false;
  }
  if (!pickup.dragHandle) {
    return true;
  }
  const closedRoots = getClosedShadowRootsByHost();
  for (
    let node: Element | null = pickup.target;
    node;
    node = getComposedParentElement(node, closedRoots)
  ) {
    if (node === pickup.dragHandle) {
      return true;
    }
  }
  return false;
}

/**
 * {@link acceptsPress}, and the press isn't on a control nested in the draggable.
 * Otherwise dragging to select text in an inline rename input would start a drag.
 * The sensor checks this at the press and again when activation commits, since
 * either can change in between.
 */
export function canPickUp(pickup: DraggablePickup): boolean {
  return (
    acceptsPress(pickup) &&
    !hasInteractiveAncestorWithin(pickup.target, pickup.dragHandle ?? pickup.element)
  );
}

/**
 * The nearest registered ancestor of the press target that {@link acceptsPress}, or `null`.
 * Callers still check {@link canPickUp}, dispatch `onBeforeMoveStart`, and check the
 * lifecycle's `isActive`. The walk refreshes every registered ancestor's static setup, so
 * one whose `disabled` or `handle` changed without re-registering doesn't keep stale styles.
 */
export function resolveDraggablePickup(rawTarget: EventTarget | null): DraggablePickup | null {
  const target = isElement(rawTarget) ? rawTarget : null;
  if (!target) {
    return null;
  }
  let pickup: DraggablePickup | null = null;
  // A `disabled` draggable, or one pressed outside its handle, falls through to an
  // outer one, so a nested card still starts its list item's drag.
  const closedRoots = getClosedShadowRootsByHost();
  for (
    let node: Element | null = target;
    node !== null;
    node = getComposedParentElement(node, closedRoots)
  ) {
    if (!isHTMLElement(node)) {
      continue;
    }
    const parameters = refreshDraggableStaticSetup(node);
    if (parameters === undefined) {
      continue;
    }
    if (pickup !== null) {
      continue;
    }
    // A press nothing picks up arms nothing, so the context menu and a descendant's
    // native HTML5 drag stay intact. Runtime vetoes belong in `onBeforeMoveStart`.
    const candidate = {
      element: node,
      target,
      parameters,
      dragHandle: resolveDragHandle(parameters),
    };
    if (acceptsPress(candidate)) {
      pickup = candidate;
    }
  }
  return pickup;
}
