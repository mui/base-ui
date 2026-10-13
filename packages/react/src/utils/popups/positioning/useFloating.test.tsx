import { expect, test, vi } from 'vitest';
import * as React from 'react';
import { flushMicrotasks, render } from '@mui/internal-test-utils';
import type { VirtualElement } from '@floating-ui/react-dom';
import { PopupTriggerMap } from '../popupTriggerMap';
import { StandaloneInteractionStore } from '../interaction-store/StandaloneInteractionStore';
import type { UseFloatingReturn } from '../types';
import { useBaseUIFloating } from './useFloating';

function Test({
  rootContext,
  onRender,
}: {
  rootContext: StandaloneInteractionStore;
  onRender(value: UseFloatingReturn): void;
}) {
  onRender(useBaseUIFloating({ rootContext }));
  return null;
}

test('uses the supplied root store while preserving DOM and position references', async () => {
  const referenceElement = document.createElement('button');
  const outerPopupElement = document.createElement('div');
  document.body.append(referenceElement, outerPopupElement);

  try {
    const store = new StandaloneInteractionStore({
      open: true,
      transitionStatus: undefined,
      baseAnchor: referenceElement,
      outerPopupElement,
      triggerElements: new PopupTriggerMap(),
      defaultPopupId: undefined,
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
    expect(floating?.context.events).toBe(store.context.events);
    expect(floating?.refs.floating.current).toBe(outerPopupElement);
    expect(floating?.refs.domReference.current).toBe(referenceElement);

    const anchorOverride: VirtualElement = {
      getBoundingClientRect: () => new DOMRect(1, 2, 3, 4),
    };

    await React.act(async () => {
      floating?.refs.setPositionReference(anchorOverride);
    });

    expect(floating?.refs.reference.current).toBe(anchorOverride);
    expect(floating?.elements.reference).toBe(anchorOverride);
    expect(store.state.anchorElement).toBe(referenceElement);
    expect(floating?.refs.domReference.current).toBe(referenceElement);
  } finally {
    referenceElement.remove();
    outerPopupElement.remove();
  }
});
