import { describe } from 'vitest';
import { describeConformance } from '#test-utils';
import { Draggable } from '@base-ui/react/draggable';
import { createDndRenderer, testDragKind } from '../../../test/dndEngine';

describe('Draggable.Trigger', () => {
  const { renderDnd } = createDndRenderer();

  describeConformance(<Draggable.Trigger />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return renderDnd(<Draggable.Root kind={testDragKind}>{node}</Draggable.Root>);
    },
  }));
});
