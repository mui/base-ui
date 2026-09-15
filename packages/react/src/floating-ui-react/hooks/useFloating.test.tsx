import { expect, test, vi } from 'vitest';
import * as React from 'react';
import { flushMicrotasks, render, screen } from '@mui/internal-test-utils';
import { PopupTriggerMap } from '../../utils/popups';
import { FloatingRootStore } from '../components/FloatingRootStore';
import type { UseFloatingReturn, VirtualElement } from '../types';
import { useBaseUIFloating, useFloating } from './useFloating';

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

function BaseUITest({
  rootContext,
  onRender,
}: {
  rootContext: FloatingRootStore;
  onRender(value: UseFloatingReturn): void;
}) {
  const floating = useBaseUIFloating({ rootContext });
  onRender(floating);

  return (
    <React.Fragment>
      <button data-testid="reference" ref={floating.refs.setReference} />
      <div data-testid="floating" ref={floating.refs.setFloating} />
    </React.Fragment>
  );
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

test('uses the supplied root store while preserving DOM and position references', async () => {
  const store = createRootStore(document.createElement('div'));
  let floating: UseFloatingReturn | undefined;

  render(
    <BaseUITest
      rootContext={store}
      onRender={(value) => {
        floating = value;
      }}
    />,
  );

  const referenceElement = screen.getByTestId('reference');
  const floatingElement = screen.getByTestId('floating');

  expect(floating?.refs.floating.current).toBe(floatingElement);
  expect(floating?.context.rootStore).toBe(store);
  expect(floating?.context.dataRef).toBe(store.context.dataRef);
  expect(floating?.context.events).toBe(store.context.events);

  await flushMicrotasks();

  expect(store.state.referenceElement).toBe(referenceElement);
  expect(store.state.domReferenceElement).toBe(referenceElement);
  expect(store.state.floatingElement).toBe(floatingElement);

  const positionReference: VirtualElement = {
    getBoundingClientRect: () => new DOMRect(1, 2, 3, 4),
  };

  await React.act(async () => {
    floating?.refs.setPositionReference(positionReference);
  });

  expect(floating?.refs.reference.current).toBe(positionReference);
  expect(floating?.elements.reference).toBe(positionReference);
  expect(store.state.referenceElement).toBe(referenceElement);
  expect(store.state.domReferenceElement).toBe(referenceElement);
  expect(floating?.refs.domReference.current).toBe(referenceElement);
});
