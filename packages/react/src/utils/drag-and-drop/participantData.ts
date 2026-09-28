import { getSharedSlot } from './sharedState';

export interface ParticipantPayload {
  payload: unknown;
  sync(declaredPayload: unknown): boolean;
  update(payload: unknown): boolean;
}

const state = getSharedSlot('participantData', () => ({
  owners: new WeakMap<object, object>(),
  payloads: new WeakMap<object, { kind: symbol | undefined; data: ParticipantPayload }>(),
}));

/** Keys a registration's payload by `owner`, so it survives a rebind of the gesture setup. */
export function setParticipantOwner(registration: object, owner: object): void {
  state.owners.set(registration, owner);
}

/**
 * Returns the payload store of a registration, creating it when missing or when
 * `kind` changed. The store belongs to the registration and outlives any one drag.
 */
export function getParticipantPayload(
  registration: object,
  kind: symbol | undefined,
  initialPayload: unknown,
): ParticipantPayload {
  const owner = state.owners.get(registration) ?? registration;
  const existing = state.payloads.get(owner);
  if (existing && existing.kind === kind) {
    return existing.data;
  }
  let declaredPayload = initialPayload;
  const data: ParticipantPayload = {
    payload: initialPayload,
    sync(nextPayload) {
      if (Object.is(declaredPayload, nextPayload)) {
        return false;
      }
      declaredPayload = nextPayload;
      return data.update(nextPayload);
    },
    update(nextPayload) {
      if (Object.is(data.payload, nextPayload)) {
        return false;
      }
      data.payload = nextPayload;
      return true;
    },
  };
  state.payloads.set(owner, { kind, data });
  return data;
}

/** Release an imperative registration's data when it unregisters. */
export function resetParticipantPayload(registration: object): void {
  state.payloads.delete(registration);
}
