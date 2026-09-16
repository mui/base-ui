import * as React from 'react';
import { Draggable } from '@base-ui/react/draggable';
import { useDragMonitor } from '@base-ui/react/use-drag-monitor';

const itemKind = Draggable.createKind('e2e-post-drag-click');

export default function PostDragClick() {
  const [documentClicks, setDocumentClicks] = React.useState(0);
  const [sourceClicks, setSourceClicks] = React.useState(0);
  const [endCount, setEndCount] = React.useState(0);

  React.useEffect(() => {
    const handleClick = () => setDocumentClicks((count) => count + 1);
    document.addEventListener('click', handleClick, { capture: true });
    return () => document.removeEventListener('click', handleClick, { capture: true });
  }, []);

  useDragMonitor({
    accept: itemKind,
    onDragEnd: () => setEndCount((count) => count + 1),
  });

  return (
    <React.Fragment>
      <Draggable.Root
        data-testid="drag-source"
        kind={itemKind}
        onClick={() => setSourceClicks((count) => count + 1)}
        style={{ width: 200, height: 100, background: 'lightgray' }}
      >
        Drag
      </Draggable.Root>
      <output data-testid="click-status">
        {JSON.stringify({ documentClicks, sourceClicks, endCount })}
      </output>
    </React.Fragment>
  );
}
