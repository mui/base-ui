import * as React from 'react';
import { Draggable } from '@base-ui/react/draggable';

const itemKind = Draggable.createKind('e2e-pointer-capture');

function PointerCaptureContent() {
  const [sourceMounted, setSourceMounted] = React.useState(true);
  const [captureCount, setCaptureCount] = React.useState(0);
  const [dropCount, setDropCount] = React.useState(0);
  const [endCount, setEndCount] = React.useState(0);

  React.useEffect(() => {
    const handleGotCapture = () => setCaptureCount((count) => count + 1);
    document.body.addEventListener('gotpointercapture', handleGotCapture);
    return () => document.body.removeEventListener('gotpointercapture', handleGotCapture);
  }, []);

  Draggable.useMonitor({
    accept: itemKind,
    onMoveEnd: () => setEndCount((count) => count + 1),
  });

  return (
    <div style={{ display: 'flex', gap: 80 }}>
      <div style={{ width: 120, height: 60 }}>
        {sourceMounted && (
          <Draggable.Root
            data-testid="drag-source"
            kind={itemKind}
            onMoveStart={() => setSourceMounted(false)}
            style={{ width: 120, height: 60, background: 'lightgray' }}
          >
            Drag
          </Draggable.Root>
        )}
      </div>
      <Draggable.Target
        data-testid="drop-target"
        accept={itemKind}
        onDraggableDrop={() => setDropCount((count) => count + 1)}
        style={{ width: 120, height: 60, background: 'lightblue' }}
      >
        Drop
      </Draggable.Target>
      <output data-testid="drag-status">
        {JSON.stringify({ sourceMounted, captureCount, dropCount, endCount })}
      </output>
    </div>
  );
}

export default function PointerCapture() {
  return (
    <Draggable.Provider>
      <PointerCaptureContent />
    </Draggable.Provider>
  );
}
