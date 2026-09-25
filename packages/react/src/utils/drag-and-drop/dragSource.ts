import type { DragSource } from '../../types/drag';
import { getSharedSlot } from './sharedState';
import { getRegistration } from './draggableRegistry';
import { dragSessionStore, notifyDragSourceUpdated } from './dragSessionStore';
import { getParticipantPayload, type ParticipantPayload } from './participantData';

const sourcePayloads = getSharedSlot(
  'dragSource.payloads',
  () => new WeakMap<DragSource, ParticipantPayload>(),
);

/** Create the mutable data shared by every callback in one drag. */
export function createDragSource(
  element: HTMLElement,
  kind: symbol,
  initialPayload: unknown,
  dragHandle: Element | null,
): DragSource {
  const registration = getRegistration(element);
  const data = getParticipantPayload(registration ?? {}, kind, initialPayload);
  data.sync(initialPayload);
  let dragData: unknown;

  const source: DragSource = {
    element,
    kind,
    dragHandle,
    get payload() {
      return readPayload();
    },
    get dragData() {
      return dragData;
    },
    updatePayload(nextPayload) {
      readPayload();
      if (data.update(nextPayload)) {
        const activeSource = dragSessionStore.state?.source;
        notifyDragSourceUpdated(
          activeSource && sourcePayloads.get(activeSource) === data ? activeSource : source,
        );
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

/** Apply committed React props without discarding updates on unrelated renders. */
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
