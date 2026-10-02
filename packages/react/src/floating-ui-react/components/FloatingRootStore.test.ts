import { describe, expect, it } from 'vitest';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import { PopupTriggerMap } from '../../utils/popups';
import {
  FloatingRootStore,
  hasCloseRequestSince,
  invalidateCloseRequest,
  markCloseRequest,
  noteFocusMove,
  takeCloseRequest,
} from './FloatingRootStore';

function createStore() {
  return new FloatingRootStore({
    open: true,
    transitionStatus: undefined,
    referenceElement: null,
    floatingElement: null,
    triggerElements: new PopupTriggerMap(),
    floatingId: undefined,
    nested: false,
    onOpenChange: undefined,
  });
}

function dispatchClose(store: FloatingRootStore, event: Event = new Event('base-ui')) {
  store.dispatchOpenChange(false, createChangeEventDetails(REASONS.none, event));
  return event;
}

function dispatchOpen(store: FloatingRootStore) {
  store.dispatchOpenChange(true, createChangeEventDetails(REASONS.triggerPress));
}

// plan-c's close request lifetime as event sequences. A mark is a focus session starting (or initial
// focus being scheduled); a take is the session's return job, once its close has committed.
describe('FloatingRootStore close requests', () => {
  it('records a close with its event and reason', () => {
    const store = createStore();
    const session = markCloseRequest(store);
    const event = dispatchClose(store);

    const request = takeCloseRequest(store, session);
    expect(request?.details.nativeEvent).toBe(event);
    expect(request?.details.reason).toBe(REASONS.none);
    expect(request?.moved).toBe(undefined);
  });

  it('records nothing for an open', () => {
    const store = createStore();
    const session = markCloseRequest(store);
    dispatchOpen(store);

    expect(takeCloseRequest(store, session)).toBe(undefined);
  });

  it('is taken once', () => {
    const store = createStore();
    const session = markCloseRequest(store);
    dispatchClose(store);

    expect(takeCloseRequest(store, session)).not.toBe(undefined);
    expect(takeCloseRequest(store, session)).toBe(undefined);
  });

  it('is replaced by a later close', () => {
    const store = createStore();
    const session = markCloseRequest(store);
    dispatchClose(store);
    const later = dispatchClose(store);

    expect(takeCloseRequest(store, session)?.details.nativeEvent).toBe(later);
  });

  it('survives a reopen dispatched and started before the close’s job runs', () => {
    const store = createStore();
    const closing = markCloseRequest(store);
    const event = dispatchClose(store);
    // `handle.open()` from a layout effect in the close commit: the popup store reopens before the
    // focus manager sees the close, and the reopened session starts before the close's job runs.
    dispatchOpen(store);
    const reopened = markCloseRequest(store);

    expect(takeCloseRequest(store, closing)?.details.nativeEvent).toBe(event);
    expect(takeCloseRequest(store, reopened)).toBe(undefined);
  });

  it('is not taken by a session that started after it', () => {
    const store = createStore();
    // A redundant close dispatched while the popup is closed.
    dispatchClose(store);
    const session = markCloseRequest(store);

    expect(hasCloseRequestSince(store, session)).toBe(false);
    expect(takeCloseRequest(store, session)).toBe(undefined);

    const event = dispatchClose(store);
    expect(takeCloseRequest(store, session)?.details.nativeEvent).toBe(event);
  });

  it('is found when the consumer commits the close with `flushSync` before it is dispatched', () => {
    const store = createStore();
    const session = markCloseRequest(store);
    // The close commits inside `onOpenChange` and queues the job; the dispatch comes after, and
    // the job takes the request when it runs.
    const event = dispatchClose(store);

    expect(takeCloseRequest(store, session)?.details.nativeEvent).toBe(event);
  });

  it('is kept for a deferred close when there is no input in between', () => {
    const store = createStore();
    const session = markCloseRequest(store);
    const event = dispatchClose(store, new MouseEvent('mouseleave'));
    noteFocusMove(store);

    const request = takeCloseRequest(store, session);
    expect(request?.details.nativeEvent).toBe(event);
    expect(request?.moved).toBe(true);
  });

  it('expires on input it did not make', () => {
    const store = createStore();
    const session = markCloseRequest(store);
    // A refused close, then the user presses inside.
    dispatchClose(store, new KeyboardEvent('keydown', { key: 'Tab' }));
    invalidateCloseRequest(store, new PointerEvent('pointerdown'));

    expect(takeCloseRequest(store, session)).toBe(undefined);
  });

  it('is kept by its own event', () => {
    const store = createStore();
    const session = markCloseRequest(store);
    const event = dispatchClose(store, new PointerEvent('pointerdown'));
    invalidateCloseRequest(store, event);

    expect(takeCloseRequest(store, session)?.details.nativeEvent).toBe(event);
  });

  it('notes a focus move only while it is pending', () => {
    const store = createStore();
    const session = markCloseRequest(store);
    noteFocusMove(store);
    dispatchClose(store);

    expect(takeCloseRequest(store, session)?.moved).toBe(undefined);
  });

  it('tells initial focus about a close requested after it was scheduled', () => {
    const store = createStore();
    dispatchClose(store);
    const scheduled = markCloseRequest(store);
    expect(hasCloseRequestSince(store, scheduled)).toBe(false);

    dispatchClose(store);
    expect(hasCloseRequestSince(store, scheduled)).toBe(true);

    invalidateCloseRequest(store, new KeyboardEvent('keydown'));
    expect(hasCloseRequestSince(store, scheduled)).toBe(false);
  });
});
