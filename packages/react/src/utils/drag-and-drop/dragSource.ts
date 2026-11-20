import type { DraggableRootRecord } from '../../draggable/root/DraggableRoot';
import { getSharedSlot } from './sharedState';
import { getRegistration, refreshDraggableStaticSetup } from './draggableRegistry';
import { dragSourceStore, notifyDragSourceUpdated } from './dragSessionStore';
import { getActiveSession } from './core/dragSession';
import type { DraggableConfig } from './draggable';

// Set from a `payload` prop publish until the next microtask (see `refreshDragSource`).
const propSync = getSharedSlot('dragSource.propSync', () => ({ notifying: false }));

/**
 * The source record every callback of one drag shares. `payload` reads through to the
 * registration's latest parameters, and `dragData` lives only as long as the record.
 */
export function createDragSource(
  element: HTMLElement,
  kind: symbol,
  initialPayload: unknown,
  dragHandle: Element | null,
): DraggableRootRecord {
  let payload = initialPayload;
  let dragData: unknown;

  const source: DraggableRootRecord = {
    element,
    kind,
    handle: dragHandle,
    // Once the element unregisters or changes kind, returns the last value this record read.
    get payload() {
      const parameters = readSourceParameters(source);
      if (parameters) {
        payload = parameters.payload;
      }
      return payload;
    },
    get dragData() {
      return dragData;
    },
    updateDragData(nextDragData) {
      if (!Object.is(dragData, nextDragData)) {
        dragData = nextDragData;
        notifyDragSourceUpdated(source);
      }
    },
  };
  return source;
}

/**
 * The latest parameters registered on the source's element, or `undefined` once the
 * element unregisters or its kind no longer matches the drag's.
 */
export function readSourceParameters(
  source: DraggableRootRecord,
): DraggableConfig<any, any> | undefined {
  const parameters = getRegistration(source.element)?.();
  return parameters?.kind.id === source.kind ? parameters : undefined;
}

/**
 * Apply a registered source's latest parameters. Gesture styles follow `disabled` and
 * `handle`, and a changed `payload` reaches `useActiveDrag()` during its drag. Moving
 * the styles mid-drag is safe, since `touch-action` no longer affects a running gesture
 * and the root lock blocks text selection.
 */
export function refreshDragSource(element: HTMLElement): void {
  refreshDraggableStaticSetup(element);
  const source = getActiveSession()?.source;
  if (
    source?.element !== element ||
    // Already published, for example by a drag data update in the same commit.
    Object.is(dragSourceStore.state?.payload, source.payload)
  ) {
    return;
  }
  // Publish at most one prop change per synchronous render cascade. Publishing re-renders
  // `useActiveDrag()` readers, and one that renders this root with an inline
  // `payload={{ ... }}` would loop until React throws. The cascade ends before the
  // microtask, and the record reads later changes live.
  if (!propSync.notifying) {
    propSync.notifying = true;
    queueMicrotask(() => {
      propSync.notifying = false;
    });
    notifyDragSourceUpdated(source);
  }
}

/**
 * Moves the active drag source to a new node, such as a row a virtualizer remounted.
 * The preview calls it when it hands the drag over (see `retargetPreviewSource`).
 * Does nothing unless `oldElement` is the active source, so an unrelated draggable
 * can't take over the session.
 */
export function retargetDragSource(oldElement: Element, newElement: HTMLElement): void {
  const session = getActiveSession();
  if (session?.source.element !== oldElement) {
    return;
  }
  const source = session.source;
  // Mutated in place so it stays `===` to the `source` of every event in the drag.
  source.element = newElement;
  // `dragSourceStore` holds a copy, so the mutation alone would leave `useActiveDrag()`
  // reading the detached node.
  notifyDragSourceUpdated(source);
}
