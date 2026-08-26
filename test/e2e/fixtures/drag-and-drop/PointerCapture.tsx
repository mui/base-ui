import * as React from 'react';
import { Draggable } from '@base-ui/react/draggable';
import { DropTarget } from '@base-ui/react/drop-target';
import { useDragMonitor } from '@base-ui/react/use-drag-monitor';

const itemKind = Draggable.createKind('e2e-pointer-capture');

export default function PointerCapture() {
  const [sourceMounted, setSourceMounted] = React.useState(true);
  const [captureCount, setCaptureCount] = React.useState(0);
  const [dropCount, setDropCount] = React.useState(0);
  const [endCount, setEndCount] = React.useState(0);

  React.useEffect(() => {
    const handleGotCapture = () => setCaptureCount((count) => count + 1);
    document.body.addEventListener('gotpointercapture', handleGotCapture);
    return () => document.body.removeEventListener('gotpointercapture', handleGotCapture);
  }, []);

  useDragMonitor({
    accept: itemKind,
    onDragEnd: () => setEndCount((count) => count + 1),
  });

  return (
    <div style={{ display: 'flex', gap: 80 }}>
      <div style={{ width: 120, height: 60 }}>
        {sourceMounted && (
          <Draggable.Root
            data-testid="drag-source"
            kind={itemKind}
            onDragStart={() => setSourceMounted(false)}
            style={{ width: 120, height: 60, background: 'lightgray' }}
          >
            Drag
          </Draggable.Root>
        )}
      </div>
      <DropTarget.Root
        data-testid="drop-target"
        accept={itemKind}
        onDrop={() => setDropCount((count) => count + 1)}
        style={{ width: 120, height: 60, background: 'lightblue' }}
      >
        Drop
      </DropTarget.Root>
      <output data-testid="drag-status">
        {JSON.stringify({ sourceMounted, captureCount, dropCount, endCount })}
      </output>
    </div>
  );
}
