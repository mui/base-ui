import { expect, test, vi } from 'vitest';
import * as React from 'react';
import { act, flushMicrotasks, render } from '@mui/internal-test-utils';
import { PopupTriggerMap } from '../../utils/popups';
import { FloatingRootStore } from '../components/FloatingRootStore';
import { useFloating } from './useFloating';

function createRootStore(floatingElement: HTMLElement) {
  return new FloatingRootStore({
    open: true,
    transitionStatus: undefined,
    referenceElement: document.createElement('button'),
    floatingElement,
    triggerElements: new PopupTriggerMap(),
    floatingId: undefined,
    syncOnly: false,
    nested: false,
    onOpenChange: vi.fn(),
  });
}

function Test({ rootContext }: { rootContext: FloatingRootStore }) {
  useFloating({ rootContext });
  return null;
}

test('preserves an externally synced floating element when the root context changes', async () => {
  const firstFloatingElement = document.createElement('div');
  const secondFloatingElement = document.createElement('div');
  const firstStore = createRootStore(firstFloatingElement);
  const secondStore = createRootStore(secondFloatingElement);

  const { rerender } = render(<Test rootContext={firstStore} />);
  await flushMicrotasks();

  expect(firstStore.state.floatingElement).toBe(firstFloatingElement);

  rerender(<Test rootContext={secondStore} />);
  await flushMicrotasks();

  expect(secondStore.state.floatingElement).toBe(secondFloatingElement);
});

test('clears the root-owned floating context on reset', async () => {
  const floatingElement = document.createElement('div');
  const referenceElement = document.createElement('button');
  const positionReference = document.createElement('div');
  const rootStore = createRootStore(floatingElement);
  const hoverInteractionState = { reset: vi.fn() };

  rootStore.context.dataRef.current.hoverInteractionState = hoverInteractionState;

  const { unmount } = render(<Test rootContext={rootStore} />);
  await flushMicrotasks();

  expect(rootStore.context.dataRef.current.floatingContext?.rootStore).toBe(rootStore);

  unmount();

  act(() => {
    rootStore.update({
      open: true,
      transitionStatus: 'starting',
      floatingId: 'floating',
      domReferenceElement: referenceElement,
      referenceElement,
      floatingElement,
      positionReference,
    });
    rootStore.reset();
  });

  expect(rootStore.state.open).toBe(false);
  expect(rootStore.state.transitionStatus).toBe(undefined);
  expect(rootStore.state.floatingId).toBe(undefined);
  expect(rootStore.state.domReferenceElement).toBe(null);
  expect(rootStore.state.referenceElement).toBe(null);
  expect(rootStore.state.floatingElement).toBe(null);
  expect(rootStore.state.positionReference).toBe(null);
  expect(rootStore.context.dataRef.current.floatingContext).toBe(undefined);
  expect(rootStore.context.dataRef.current.hoverInteractionState).toBe(hoverInteractionState);
});
