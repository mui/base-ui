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
 * Returns the payload store of a registration, synced with `declaredPayload`, and
 * whether the sync changed it. The store is created when missing or when `kind`
 * changed. It belongs to the registration and outlives any one drag.
 */
export function syncParticipantPayload(
  registration: object,
  kind: symbol | undefined,
  declaredPayload: unknown,
): { data: ParticipantPayload; changed: boolean } {
  const owner = state.owners.get(registration) ?? registration;
  const existing = state.payloads.get(owner);
  if (existing && existing.kind === kind) {
    return { data: existing.data, changed: existing.data.sync(declaredPayload) };
  }
  const data = createParticipantPayload(declaredPayload);
  state.payloads.set(owner, { kind, data });
  return { data, changed: false };
}

function createParticipantPayload(initialPayload: unknown): ParticipantPayload {
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
  return data;
}

/** Release an imperative registration's data when it unregisters. */
export function resetParticipantPayload(registration: object): void {
  state.payloads.delete(registration);
}
