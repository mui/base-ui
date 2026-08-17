import fs from 'node:fs/promises';

const snapshotPath = process.argv[2];

if (!snapshotPath) {
  throw new Error('A bundle-size snapshot path is required.');
}

const budgets = {
  'drag-and-drop/leaf/Draggable.Root': { parsed: 83000, gzip: 28000 },
  'drag-and-drop/leaf/Draggable.Displacement': { parsed: 10000, gzip: 4000 },
  'drag-and-drop/leaf/Draggable.Root+Displacement': { parsed: 86000, gzip: 29000 },
  'drag-and-drop/leaf/Draggable.Handle': { parsed: 10000, gzip: 4000 },
  'drag-and-drop/leaf/Draggable.Preview': { parsed: 12000, gzip: 5000 },
  'drag-and-drop/leaf/Draggable.Root+Preview': { parsed: 88000, gzip: 29500 },
  'drag-and-drop/leaf/Draggable.ClonedPreview': { parsed: 11000, gzip: 4500 },
  'drag-and-drop/leaf/Draggable.Root+ClonedPreview': { parsed: 87000, gzip: 29000 },
  'drag-and-drop/leaf/Draggable.createClonedPreview': { parsed: 9500, gzip: 4000 },
  'drag-and-drop/leaf/Draggable.PreviewProvider': { parsed: 7000, gzip: 3000 },
  'drag-and-drop/leaf/DropTarget.Root': { parsed: 16000, gzip: 6000 },
  'drag-and-drop/leaf/DragAutoScroll.Root': { parsed: 65000, gzip: 22000 },
  'drag-and-drop/leaf/Draggable.Root+DragAutoScroll.Root': { parsed: 91000, gzip: 30500 },
  'drag-and-drop/leaf/useDragMonitor': { parsed: 2500, gzip: 1200 },
  'drag-and-drop/leaf/useDragDropManager': { parsed: 83000, gzip: 28000 },
};

const snapshot = JSON.parse(await fs.readFile(snapshotPath, 'utf8'));
const failures = [];

for (const [id, budget] of Object.entries(budgets)) {
  const size = snapshot[id];
  if (!size) {
    failures.push(`${id}: missing from the bundle-size snapshot`);
    continue;
  }

  for (const format of ['parsed', 'gzip']) {
    if (size[format] > budget[format]) {
      failures.push(`${id}: ${format} ${size[format]} B exceeds ${budget[format]} B`);
    }
  }
}

if (failures.length > 0) {
  throw new Error(`Drag-and-drop leaf bundle budgets failed:\n${failures.join('\n')}`);
}

process.stdout.write(
  `All ${Object.keys(budgets).length} drag-and-drop leaf bundles are within budget.\n`,
);
