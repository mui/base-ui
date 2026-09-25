import * as React from 'react';
import { Draggable } from '@base-ui/react/draggable';

const itemKind = Draggable.createKind('e2e-touch-scroll');

/**
 * A page taller than the viewport with a press-hold draggable: a held touch must
 * pick the item up and keep the page still, while a plain swipe must scroll it
 * and never start a drag.
 */
function TouchScrollContent() {
  const [mounted, setMounted] = React.useState(true);
  const [dropCount, setDropCount] = React.useState(0);
  const [result, setResult] = React.useState<{ reason: string; dropped: boolean } | null>(null);
  const [startCount, setStartCount] = React.useState(0);
  const [endCount, setEndCount] = React.useState(0);

  Draggable.useMonitor({
    accept: itemKind,
    onMoveStart: () => setStartCount((count) => count + 1),
    onMoveEnd: ({ target }, details) => {
      setEndCount((count) => count + 1);
      setResult({ reason: details.reason, dropped: target !== null });
    },
  });

  return (
    <div style={{ height: 3000 }}>
      {/* Room above the draggable for an upward swipe to stay inside the viewport. */}
      <div style={{ height: 300 }} />
      {mounted && (
        <Draggable.Root
          data-testid="drag-source"
          kind={itemKind}
          activation={{ touch: { type: 'press-hold', delay: 250 } }}
          style={{ width: 200, height: 100, background: 'lightgray' }}
        >
          Hold to drag
        </Draggable.Root>
      )}
      <Draggable.Target
        accept={itemKind}
        data-testid="drop-target"
        onDraggableDrop={() => setDropCount((count) => count + 1)}
        style={{ position: 'absolute', left: 0, top: 100, width: 200, height: 100 }}
      >
        Drop here
      </Draggable.Target>
      <button type="button" data-testid="unmount-source" onClick={() => setMounted(false)}>
        Remove source
      </button>
      <output data-testid="drop-status">{JSON.stringify({ dropCount, ...result })}</output>
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
