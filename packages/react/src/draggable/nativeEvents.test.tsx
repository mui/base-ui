import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { createEvent, fireEvent, screen } from '@testing-library/react';
import { createRenderer } from '#test-utils';
import { Draggable } from '@base-ui/react/draggable';

describe('Draggable native events', () => {
  const { render } = createRenderer();

  for (const [name, Part] of [
    ['Root', (props: React.DOMAttributes<HTMLDivElement>) => <Draggable.Root {...props} />],
    ['Target', (props: React.DOMAttributes<HTMLDivElement>) => <Draggable.Target {...props} />],
    ['Viewport', (props: React.DOMAttributes<HTMLDivElement>) => <Draggable.Viewport {...props} />],
  ] as const) {
    it(`forwards native events on ${name}`, async () => {
      const onDrop = vi.fn();
      const onDragOver = vi.fn((event: React.DragEvent) => event.preventDefault());
      const onDropCapture = vi.fn();
      const onMoveStart = vi.fn();
      const onDraggableDrop = vi.fn();
      const props = { 'data-testid': 'part', onDrop, onDragOver, onDropCapture };
      await render(
        <Draggable.Provider>
          <Draggable.Root onMoveStart={onMoveStart}>
            <Draggable.Target accept={Draggable.anyKind} onDraggableDrop={onDraggableDrop}>
              <Part {...props} />
            </Draggable.Target>
          </Draggable.Root>
        </Draggable.Provider>,
      );
      const element = screen.getByTestId('part');
      const dataTransfer = { files: [new File(['contents'], 'example.txt')] };
      const dragOver = createEvent.dragOver(element);
      const drop = createEvent.drop(element);
      Object.defineProperty(dragOver, 'dataTransfer', { value: dataTransfer });
      Object.defineProperty(drop, 'dataTransfer', { value: dataTransfer });
      expect(fireEvent(element, dragOver)).toBe(false);
      fireEvent(element, drop);
      expect(onDragOver).toHaveBeenCalledOnce();
      expect(onDrop).toHaveBeenCalledOnce();
      expect(onDropCapture).toHaveBeenCalledOnce();
      expect(onDrop.mock.calls[0][0].dataTransfer.files[0].name).toBe('example.txt');
      expect(onMoveStart).not.toHaveBeenCalled();
      expect(onDraggableDrop).not.toHaveBeenCalled();
    });
  }
});
