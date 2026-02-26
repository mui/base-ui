import { act } from '@mui/internal-test-utils';
import { vi } from 'vitest';
import { FloatingTreeStore } from './components/FloatingTreeStore';
import type { HandleCloseContext } from './hooks/useHoverShared';
import { safePolygon } from './safePolygon';
import { getEmptyRootContext } from './utils/getEmptyRootContext';

function createRect(left: number, top: number, width: number, height: number) {
  return {
    x: left,
    y: top,
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
    toJSON() {
      return this;
    },
  } satisfies DOMRect;
}

function createMouseMoveEvent(clientX: number, clientY: number): MouseEvent {
  return {
    type: 'mousemove',
    clientX,
    clientY,
    relatedTarget: null,
    composedPath: () => [null],
  } as unknown as MouseEvent;
}

function createHandleCloseContext({
  domReference,
  floating,
  onClose,
  tree,
}: {
  domReference: Element;
  floating: HTMLElement;
  onClose: () => void;
  tree: FloatingTreeStore;
}): HandleCloseContext {
  const refs: HandleCloseContext['refs'] = {
    reference: { current: domReference },
    floating: { current: floating },
    domReference: { current: domReference },
    setReference() {},
    setFloating() {},
    setPositionReference() {},
  };

  const events: HandleCloseContext['events'] = {
    emit() {},
    on() {},
    off() {},
  };

  return {
    x: 2,
    y: 0,
    strategy: 'absolute',
    placement: 'right',
    middlewareData: {},
    isPositioned: true,
    update: async () => {},
    floatingStyles: {},
    open: true,
    onOpenChange() {},
    events,
    dataRef: { current: {} },
    nodeId: 'root',
    floatingId: 'floating-id',
    refs,
    elements: { reference: domReference, domReference, floating },
    rootStore: getEmptyRootContext(),
    onClose,
    tree,
  };
}

describe('safePolygon', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not close when a nested child is open', async () => {
    const domReference = document.createElement('button');
    const floating = document.createElement('div');
    domReference.getBoundingClientRect = () => createRect(0, 0, 100, 100);
    floating.getBoundingClientRect = () => createRect(120, 0, 100, 100);

    const tree = new FloatingTreeStore();
    const onClose = vi.fn();
    const context = createHandleCloseContext({
      domReference,
      floating,
      onClose,
      tree,
    });

    const openChildContext = { ...context, open: true };
    tree.addNode({ id: 'child', parentId: 'root', context: openChildContext });

    const handler = safePolygon()(context);
    handler(createMouseMoveEvent(3, -1));

    await act(async () => {
      vi.advanceTimersByTime(50);
    });

    expect(onClose).toHaveBeenCalledTimes(0);
  });

  it('closes after intent timeout when no nested child is open', async () => {
    const domReference = document.createElement('button');
    const floating = document.createElement('div');
    domReference.getBoundingClientRect = () => createRect(0, 0, 100, 100);
    floating.getBoundingClientRect = () => createRect(120, 0, 100, 100);

    const tree = new FloatingTreeStore();
    const onClose = vi.fn();
    const context = createHandleCloseContext({
      domReference,
      floating,
      onClose,
      tree,
    });

    const closedChildContext = { ...context, open: false };
    tree.addNode({ id: 'child', parentId: 'root', context: closedChildContext });

    const handler = safePolygon()(context);
    handler(createMouseMoveEvent(3, -1));

    await act(async () => {
      vi.advanceTimersByTime(50);
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
