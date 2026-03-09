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
  placement = 'right',
  x = 2,
  y = 0,
}: {
  domReference: Element;
  floating: HTMLElement;
  onClose: () => void;
  tree: FloatingTreeStore;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  x?: number;
  y?: number;
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
    x,
    y,
    strategy: 'absolute',
    placement,
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

function createPlacementScenario(placement: 'top' | 'bottom' | 'left' | 'right') {
  const referenceRect = createRect(0, 0, 100, 100);

  switch (placement) {
    case 'top':
      return {
        referenceRect,
        floatingRect: createRect(0, -120, 100, 100),
        leavePoint: [50, 0] as const,
        troughPoint: [50, -10] as const,
        outsidePoint: [50, 150] as const,
      };
    case 'bottom':
      return {
        referenceRect,
        floatingRect: createRect(0, 120, 100, 100),
        leavePoint: [50, 100] as const,
        troughPoint: [50, 110] as const,
        outsidePoint: [50, -50] as const,
      };
    case 'left':
      return {
        referenceRect,
        floatingRect: createRect(-120, 0, 100, 100),
        leavePoint: [0, 50] as const,
        troughPoint: [-10, 50] as const,
        outsidePoint: [150, 50] as const,
      };
    case 'right':
      return {
        referenceRect,
        floatingRect: createRect(120, 0, 100, 100),
        leavePoint: [100, 50] as const,
        troughPoint: [110, 50] as const,
        outsidePoint: [-50, 50] as const,
      };
    default:
      return {
        referenceRect,
        floatingRect: createRect(120, 0, 100, 100),
        leavePoint: [100, 50] as const,
        troughPoint: [110, 50] as const,
        outsidePoint: [-50, 50] as const,
      };
  }
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

  it.each(['top', 'bottom', 'left', 'right'] as const)(
    'keeps open while moving through the trough on %s placement',
    (placement) => {
      const domReference = document.createElement('button');
      const floating = document.createElement('div');
      const scenario = createPlacementScenario(placement);

      domReference.getBoundingClientRect = () => scenario.referenceRect;
      floating.getBoundingClientRect = () => scenario.floatingRect;

      const tree = new FloatingTreeStore();
      const onClose = vi.fn();
      const context = createHandleCloseContext({
        domReference,
        floating,
        onClose,
        tree,
        placement,
        x: scenario.leavePoint[0],
        y: scenario.leavePoint[1],
      });

      const handler = safePolygon()(context);
      handler(createMouseMoveEvent(scenario.troughPoint[0], scenario.troughPoint[1]));

      expect(onClose).toHaveBeenCalledTimes(0);
    },
  );

  it.each(['top', 'bottom', 'left', 'right'] as const)(
    'closes when moving away from corridor on %s placement',
    (placement) => {
      const domReference = document.createElement('button');
      const floating = document.createElement('div');
      const scenario = createPlacementScenario(placement);

      domReference.getBoundingClientRect = () => scenario.referenceRect;
      floating.getBoundingClientRect = () => scenario.floatingRect;

      const tree = new FloatingTreeStore();
      const onClose = vi.fn();
      const context = createHandleCloseContext({
        domReference,
        floating,
        onClose,
        tree,
        placement,
        x: scenario.leavePoint[0],
        y: scenario.leavePoint[1],
      });

      const handler = safePolygon()(context);
      handler(createMouseMoveEvent(scenario.outsidePoint[0], scenario.outsidePoint[1]));

      expect(onClose).toHaveBeenCalledTimes(1);
    },
  );
});
