import type { DraggableRootRecord } from '../../draggable/root/DraggableRoot';
import { getSharedSlot } from './sharedState';
import { getRegistration } from './draggableRegistry';
import { dragSessionStore, notifyDragSourceUpdated } from './dragSessionStore';
import { getParticipantPayload } from './participantData';
import type { ParticipantPayload } from './participantData';

const sourcePayloads = getSharedSlot(
  'dragSource.payloads',
  () => new WeakMap<DraggableRootRecord, ParticipantPayload>(),
);

/**
 * Creates the source record that every callback of one drag shares. `payload` reads
 * through to the registration's latest parameters, and `dragData` lives only as long
 * as this record.
 */
export function createDragSource(
  element: HTMLElement,
  kind: symbol,
  initialPayload: unknown,
  dragHandle: Element | null,
): DraggableRootRecord {
  const registration = getRegistration(element);
  const data = getParticipantPayload(registration ?? {}, kind, initialPayload);
  data.sync(initialPayload);
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
        // Every drag record of this registration shares `data`, so notify the
        // active drag's record, even when it isn't this one.
        const activeSource = dragSessionStore.state?.source;
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
  const source = dragSessionStore.state?.source;
  if (source?.element === element && source.kind === kind) {
    if (sourcePayloads.get(source)?.sync(payload)) {
      notifyDragSourceUpdated(source);
    }
  } else {
    const registration = getRegistration(element);
    if (registration) {
      getParticipantPayload(registration, kind, payload).sync(payload);
    }
  }
}
