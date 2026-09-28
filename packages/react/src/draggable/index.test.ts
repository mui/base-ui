import { describe, it, expect } from 'vitest';
import { Draggable } from '@base-ui/react/draggable';

describe('Draggable namespace', () => {
  it('exposes exactly the documented parts, hooks, and helpers', () => {
    // A fixed list, so adding or removing a public part or helper fails this test.
    // Update it together with the docs.
    expect(Object.keys(Draggable).sort()).toEqual(
      [
        'CollisionProvider',
        'Handle',
        'Preview',
        'Provider',
        'Root',
        'Target',
        'Viewport',
        'anyKind',
        'createGlobalKind',
        'createKind',
        'restrictToElement',
        'restrictToHorizontalAxis',
        'restrictToParentElement',
        'restrictToVerticalAxis',
        'restrictToWindowEdges',
        'snapToGrid',
        'useActiveDrag',
        'useManager',
        'useMonitor',
      ].sort(),
    );
  });
});
