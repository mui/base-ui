import { expect, test, vi } from 'vitest';
import * as React from 'react';
import { flushMicrotasks, render } from '@mui/internal-test-utils';
import type { VirtualElement } from '@floating-ui/react-dom';
import { PopupTriggerMap } from '../popupTriggerMap';
import { FloatingRootStore } from '../floating-root/FloatingRootStore';
import type { UseFloatingReturn } from '../floating-root/types';
import { useBaseUIFloating } from './useFloating';

function Test({
  rootContext,
  onRender,
}: {
  rootContext: FloatingRootStore;
  onRender(value: UseFloatingReturn): void;
}) {
  onRender(useBaseUIFloating({ rootContext }));
  return null;
}

test('uses the supplied root store while preserving DOM and position references', async () => {
  const referenceElement = document.createElement('button');
  const floatingElement = document.createElement('div');
  document.body.append(referenceElement, floatingElement);

  try {
    const store = new FloatingRootStore({
      open: true,
      transitionStatus: undefined,
      referenceElement,
      floatingElement,
      triggerElements: new PopupTriggerMap(),
      floatingId: undefined,
      nested: false,
      onOpenChange: vi.fn(),
    });
    let floating: UseFloatingReturn | undefined;

    render(
      <Test
        rootContext={store}
        onRender={(value) => {
          floating = value;
        }}
      />,
    );
    await flushMicrotasks();

    expect(floating?.context.rootStore).toBe(store);
    expect(floating?.context.dataRef).toBe(store.context.dataRef);
    expect(floating?.context.events).toBe(store.context.events);
    expect(floating?.refs.floating.current).toBe(floatingElement);
    expect(floating?.refs.domReference.current).toBe(referenceElement);

    const positionReference: VirtualElement = {
      getBoundingClientRect: () => new DOMRect(1, 2, 3, 4),
    };

    await React.act(async () => {
      floating?.refs.setPositionReference(positionReference);
    });

    expect(floating?.refs.reference.current).toBe(positionReference);
    expect(floating?.elements.reference).toBe(positionReference);
    expect(store.state.domReferenceElement).toBe(referenceElement);
    expect(floating?.refs.domReference.current).toBe(referenceElement);
  } finally {
    referenceElement.remove();
    floatingElement.remove();
  }
});
