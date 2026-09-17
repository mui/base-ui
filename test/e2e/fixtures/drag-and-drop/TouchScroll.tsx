import * as React from 'react';
import { Draggable } from '@base-ui/react/draggable';
import { useDragMonitor } from '@base-ui/react/use-drag-monitor';

const itemKind = Draggable.createKind('e2e-touch-scroll');

/**
 * A page taller than the viewport with a press-hold draggable: a held touch must
 * pick the item up and keep the page still, while a plain swipe must scroll it
 * and never start a drag.
 */
function TouchScrollContent() {
  const [startCount, setStartCount] = React.useState(0);
  const [endCount, setEndCount] = React.useState(0);

  useDragMonitor({
    accept: itemKind,
    onMoveStart: () => setStartCount((count) => count + 1),
    onMoveEnd: () => setEndCount((count) => count + 1),
  });

  return (
    <div style={{ height: 3000 }}>
      {/* Room above the draggable for an upward swipe to stay inside the viewport. */}
      <div style={{ height: 300 }} />
      <Draggable.Root
        data-testid="drag-source"
        kind={itemKind}
        activation={{ touch: { type: 'press-hold', delay: 250 } }}
        style={{ width: 200, height: 100, background: 'lightgray' }}
      >
        Hold to drag
      </Draggable.Root>
      <output data-testid="drag-status">{JSON.stringify({ startCount, endCount })}</output>
    </div>
  );
}

export default function TouchScroll() {
  return (
    <Draggable.Provider>
      <TouchScrollContent />
    </Draggable.Provider>
  );
}
