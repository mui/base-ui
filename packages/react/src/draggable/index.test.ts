import { describe, it, expect } from 'vitest';
import { Draggable } from '@base-ui/react/draggable';

describe('Draggable namespace', () => {
  it('exposes exactly the documented parts, hooks, and helpers', () => {
    // A fixed list, so a part or helper cannot disappear from (or sneak into) the
    // public namespace unnoticed. Update it deliberately with the docs.
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
