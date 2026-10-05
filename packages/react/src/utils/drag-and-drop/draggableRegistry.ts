/**
 * Registry of draggable elements.
 *
 * The pointer sensor looks up the pressed draggable here at pickup. The map lives
 * in a `getSharedSlot`, so two bundled copies of the engine share it.
 */

import { isElement, isHTMLElement } from '@floating-ui/utils/dom';
import type { DragCleanupFn } from './types';
import type { DraggableConfig } from './draggable';
import { createGetterStackRegistry } from './getterStackRegistry';
import { hasInteractiveAncestorWithin } from './interactiveElement';
import { getSharedSlot } from './sharedState';
import { getComposedParentElement, resolveElementReference } from './utils';

/** Returns one registration's latest draggable parameters. Read at gesture start. */
type DraggableGetter = () => DraggableConfig<any, any>;

interface DraggableRegistration {
  getParameters: DraggableGetter;
  /**
   * Re-applies this registration's static setup (see `applyDraggableStaticSetup`)
   * from the element's active parameters.
   */
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

/**
 * Registers `element` as a draggable. `refreshStaticSetup` runs on each pointer
 * press inside the element (see {@link resolveDraggablePickup}). Returns the
 * cleanup that releases this hold.
 */
export function addDraggableRegistration(
  element: HTMLElement,
  getParameters: DraggableGetter,
  refreshStaticSetup: DraggableRegistration['refreshStaticSetup'],
): DragCleanupFn {
  return holds.hold(element, { getParameters, refreshStaticSetup });
}

/** The element's last registered parameters getter, or `undefined` when it isn't registered. */
export function getRegistration(element: HTMLElement): DraggableGetter | undefined {
  return holds.getActive(element)?.getParameters;
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
 * Whether the draggable accepts a press on `target`: it isn't `disabled`, and
 * the press began inside its drag handle, if it has one. With a handle, controls
 * elsewhere in the draggable keep their own behavior.
 *
 * The handle check walks the composed tree, as {@link canPickUp} does, so content
 * slotted into a handle that wraps a `<slot>` counts as inside it.
 */
function acceptsPress(pickup: Omit<DraggablePickup, 'element'>): boolean {
  if (pickup.parameters.disabled) {
    return false;
  }
  if (!pickup.dragHandle) {
    return true;
  }
  for (let node: Element | null = pickup.target; node; node = getComposedParentElement(node)) {
    if (node === pickup.dragHandle) {
      return true;
    }
  }
  return false;
}

/**
 * Whether a press on `pickup.target` may pick up `pickup.element`. On top of
 * {@link acceptsPress}, a control nested inside the draggable handles its own
 * press. Otherwise, pressing an inline rename input and dragging to select text
 * would cross the activation threshold, and the drag would cancel the selection.
 * The sensor checks this at the press and again when activation commits, since
 * each condition may change during the press.
 */
export function canPickUp(pickup: DraggablePickup): boolean {
  return (
    acceptsPress(pickup) &&
    !hasInteractiveAncestorWithin(pickup.target, pickup.dragHandle ?? pickup.element)
  );
}

/**
 * Resolves the draggable a press picks up. Starting from the event target, finds
 * the nearest registered draggable ancestor that isn't `disabled` and whose drag
 * handle, if any, contains the target. Returns `null` when none qualifies. Callers
 * still check {@link canPickUp}, dispatch `onBeforeMoveStart` and check the
 * lifecycle's `isActive`.
 *
 * The walk also refreshes the static setup of every registered ancestor, so an
 * imperative registration that changes `disabled` or `handle` without
 * re-registering doesn't keep stale gesture styles. The pointer sensor calls this
 * on every press.
 */
export function resolveDraggablePickup(rawTarget: EventTarget | null): DraggablePickup | null {
  const target = isElement(rawTarget) ? rawTarget : null;
  if (!target) {
    return null;
  }
  let pickup: DraggablePickup | null = null;
  // Walk up the ancestors, crossing shadow boundaries. When the press began
  // outside the innermost draggable's handle, or that draggable is `disabled`,
  // fall through to an outer registered draggable. A nested card inside a
  // draggable list item then still starts the outer drag.
  //
  // The walk continues past the draggable it picks, because every registered
  // ancestor's static setup must be refreshed, not only the innermost one's.
  for (let node: Element | null = target; node !== null; node = getComposedParentElement(node)) {
    if (!isHTMLElement(node)) {
      continue;
    }
    const stack = registrations.get(node);
    if (stack === undefined || stack.length === 0) {
      continue;
    }
    const parameters = stack[stack.length - 1].getParameters();
    // Copy first, since a refresh can re-register and mutate the stack. Each
    // registration's setup follows the element's active parameters.
    for (const registration of [...stack]) {
      registration.refreshStaticSetup(parameters);
    }
    if (pickup !== null) {
      continue;
    }
    // When nothing picks the press up, the sensor arms nothing for it. The
    // context menu isn't suppressed, and a natively draggable descendant such as
    // `<img>` or `<a href>` keeps its HTML5 drag. A veto that depends on runtime
    // state belongs in `onBeforeMoveStart`, which runs when activation commits.
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
