/**
 * Shared registry of draggable elements.
 *
 * Both sensors — the pointer sensor (`synthetic/syntheticSensor.ts`) and the
 * keyboard sensor (`keyboard/keyboardSensor.ts`) — read from this single
 * registry so a draggable is registered once and driveable by either input.
 * Routed through `getSharedSlot` so a doubly-bundled engine shares one map.
 */

import { isElement, isHTMLElement } from '@floating-ui/utils/dom';
import { contains } from '@base-ui/utils/shadowDom';
import type { DragCleanupFn } from '../../types/drag';
import type { DraggableConfig } from './draggable';
import { createGetterStackRegistry } from './getterStackRegistry';
import { getSharedSlot } from './sharedState';
import { getComposedParentElement, resolveElementReference } from './utils';

/** Getter for a single hook's latest draggable parameters, read fresh at gesture start. */
type DraggableGetter = () => DraggableConfig<any>;

interface RegistryState {
  /**
   * Maps each registered element to the stack of parameter getters held against
   * it — one per `Draggable.Root` whose ref landed on the node (merged-ref
   * composition). The last getter wins (a re-registration refreshes the
   * closures); each cleanup removes *its own* getter by identity, so releasing a
   * non-last hold can't strand the surviving hook's parameters.
   */
  registry: WeakMap<HTMLElement, DraggableGetter[]>;
}

const state = getSharedSlot<RegistryState>('draggableRegistry', () => ({
  registry: new WeakMap<HTMLElement, DraggableGetter[]>(),
}));

const holds = createGetterStackRegistry<HTMLElement, DraggableGetter>({
  entries: state.registry,
});

/** Register (or re-register) `element` as a draggable with the given parameters getter. */
export function registerDraggable(
  element: HTMLElement,
  getParameters: DraggableGetter,
): DragCleanupFn {
  return holds.hold(element, getParameters);
}

/** The element's latest parameters getter (last hold wins), or `undefined` when unregistered. */
export function getRegistration(element: HTMLElement): DraggableGetter | undefined {
  return holds.getActive(element);
}

/**
 * Walk up from `target` (crossing shadow boundaries) to the nearest registered
 * draggable element, or `null` when none is found.
 */
export function findRegisteredAncestor(target: Element | null): HTMLElement | null {
  let node: Element | null = target;
  while (node) {
    if (isHTMLElement(node) && state.registry.has(node)) {
      return node;
    }
    node = getComposedParentElement(node);
  }
  return null;
}

export interface DraggablePickup {
  /** The nearest registered draggable ancestor of the event target. */
  element: HTMLElement;
  /** The resolved event target (inside, or equal to, `element`). */
  target: Element;
  /** The draggable's latest parameters, read fresh at gesture start. */
  parameters: DraggableConfig<any>;
  /** The configured drag handle, or `null` when the whole element is draggable. */
  dragHandle: Element | null;
}

/**
 * Shared pickup resolution for the pointer and keyboard sensors. From a raw event
 * target, find the nearest registered draggable ancestor, read its latest
 * parameters, resolve the drag handle, and enforce the handle-`contains` gate.
 * Returns `null` when the gesture must not start. Callers still run their own
 * sensor-specific `disabled` gate / `onBeforeDragStart` dispatch (the input
 * differs per sensor) and `canStartLifecycle`.
 */
export function resolveDraggablePickup(rawTarget: EventTarget | null): DraggablePickup | null {
  const target = isElement(rawTarget) ? rawTarget : null;
  if (!target) {
    return null;
  }
  // Walk the registered-draggable ancestor chain. The innermost registered
  // draggable may gate pickup on its own drag handle; if the gesture began
  // outside that handle — or the draggable is `disabled` — fall through to an
  // *outer* registered draggable rather than becoming drag-inert — so a nested
  // card inside a draggable list item still starts the outer drag.
  let searchFrom: Element | null = target;
  while (searchFrom) {
    const element = findRegisteredAncestor(searchFrom);
    if (!element) {
      return null;
    }
    const getParameters = getRegistration(element);
    if (getParameters) {
      const parameters = getParameters();
      const dragHandle = resolveElementReference(parameters.dragHandle, undefined);
      // With a configured drag handle, only pick up if the gesture began within
      // it — so an action control elsewhere inside the draggable keeps its own
      // behaviour. A `disabled` draggable can never start a drag, so it is
      // skipped the same way. Otherwise continue from this element's parent.
      if (!parameters.disabled && (!dragHandle || contains(dragHandle, target))) {
        return { element, target, parameters, dragHandle };
      }
    }
    searchFrom = getComposedParentElement(element);
  }
  return null;
}
