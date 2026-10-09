import type { DraggableRootRecord } from '../../draggable/root/DraggableRoot';
import { getSharedSlot } from './sharedState';
import { getRegistration, refreshDraggableStaticSetup } from './draggableRegistry';
import { notifyDragSourceUpdated } from './dragSessionStore';
import { getActiveSession } from './core/dragSession';
import { syncParticipantPayload } from './participantData';
import type { ParticipantPayload } from './participantData';

const sourcePayloads = getSharedSlot(
  'dragSource.payloads',
  () => new WeakMap<DraggableRootRecord, ParticipantPayload>(),
);

// Set while a `payload` prop change is being published, until the next microtask.
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
  const registration = getRegistration(element);
  const data = syncParticipantPayload(registration ?? {}, kind, initialPayload);
  let dragData: unknown;

  const source: DraggableRootRecord = {
    element,
    kind,
    handle: dragHandle,
    get payload() {
      return readPayload();
    },
    get dragData() {
      return dragData;
    },
    updatePayload(nextPayload) {
      readPayload();
      if (data.update(nextPayload)) {
        // Every record of this registration shares `data`, so notify the active
        // drag's record even when it isn't this one.
        const activeSource = getActiveSession()?.source;
        if (activeSource && sourcePayloads.get(activeSource) === data) {
          notifyDragSourceUpdated(activeSource);
        }
      }
    },
    updateDragData(nextDragData) {
      if (!Object.is(dragData, nextDragData)) {
        dragData = nextDragData;
        notifyDragSourceUpdated(source);
      }
    },
  };
  function readPayload() {
    const parameters = getRegistration(source.element)?.();
    if (parameters?.kind.id === kind) {
      data.sync(parameters.payload);
    }
    return data.payload;
  }

  sourcePayloads.set(source, data);
  return source;
}

/**
 * Apply a registered source's latest parameters: gesture styles follow `disabled` and
 * `handle`, and a changed `payload` reaches `useActiveDrag()` during its drag. Moving
 * the styles mid-drag is harmless: `touch-action` no longer applies to the gesture,
 * and the root lock prevents text selection.
 */
export function refreshDragSource(element: HTMLElement): void {
  const parameters = refreshDraggableStaticSetup(element);
  if (parameters !== undefined) {
    syncActiveDragSourcePayload(element, parameters.kind.id, parameters.payload);
  }
}

/**
 * Syncs a committed `payload` prop into the source's payload store. A render that
 * passes the same `payload` keeps a value set through `updatePayload()`.
 */
export function syncActiveDragSourcePayload(
  element: HTMLElement | null,
  kind: symbol,
  payload: unknown,
): void {
  if (element === null) {
    return;
  }
  const source = getActiveSession()?.source;
  if (source?.element === element && source.kind === kind) {
    // Publish at most one prop change per synchronous render cascade. Otherwise an
    // inline `payload={{ ... }}` loops until React throws: publishing re-renders a
    // `useActiveDrag()` reader that renders this root with a new object. The cascade
    // flushes before the microtask; later changes in it are stored silently.
    if (sourcePayloads.get(source)?.sync(payload) && !propSync.notifying) {
      propSync.notifying = true;
      queueMicrotask(() => {
        propSync.notifying = false;
      });
      notifyDragSourceUpdated(source);
    }
  } else {
    const registration = getRegistration(element);
    if (registration) {
      syncParticipantPayload(registration, kind, payload);
    }
  }
}

/**
 * Moves the active drag source to a new node, such as a row a virtualizer remounted,
 * along with the preview's `data-dragging` marking. Does nothing unless `oldElement`
 * is the active source, so an unrelated draggable can't take over the session.
 */
export function retargetDragSource(oldElement: Element, newElement: HTMLElement): void {
  const session = getActiveSession();
  if (session?.source.element !== oldElement) {
    return;
  }
  const source = session.source;
  // Mutated in place so it stays `===` to the `source` of every event in the drag.
  source.element = newElement;
  // Publishes a new copy (see `dragSourceStore`); the mutated object alone would leave
  // `useActiveDrag()` and `Draggable.Root`'s `dragging` reading the detached node.
  notifyDragSourceUpdated(source);
  session.preview?.retargetSource(newElement);
}
