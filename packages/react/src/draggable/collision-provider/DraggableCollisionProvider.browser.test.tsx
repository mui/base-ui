import * as React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { createDndRenderer, firePointer, isJSDOM } from '#test-utils';
import { Draggable } from '@base-ui/react/draggable';
import { flushRaf, setupDragEngineTests } from '../../../test/dnd';

setupDragEngineTests();
const kind = Draggable.createKind<string>('collision-layout');

describe.skipIf(isJSDOM)('Draggable.CollisionProvider (real hit testing)', () => {
  const { renderDnd } = createDndRenderer();

  it('captures movement and release coordinates before source callbacks move the target', async () => {
    const changed = vi.fn();
    const ended = vi.fn();
    const targetRef = React.createRef<HTMLDivElement>();
    await renderDnd(
      <Draggable.CollisionProvider kind={kind} onCollisionChange={changed} onMoveEnd={ended}>
        <Draggable.Root
          kind={kind}
          payload="a"
          data-testid="source"
          activation={{ mouse: { type: 'immediate' } }}
          style={{ position: 'fixed', top: 0, left: 0, width: 100, height: 100 }}
          onMove={(_, { location }) => {
            if (location.current.targets[0]?.payload === 'b') {
              targetRef.current!.style.top = '400px';
            }
          }}
          onMoveEnd={() => {
            targetRef.current!.style.top = '600px';
          }}
        >
          <Draggable.Preview disabled />
        </Draggable.Root>
        <Draggable.Root
          ref={targetRef}
          kind={kind}
          payload="b"
          snap={{ y: 4 }}
          style={{ position: 'fixed', top: 200, left: 0, width: 100, height: 100 }}
        />
      </Draggable.CollisionProvider>,
    );
    const source = screen.getByTestId('source');
    const pointer = { pointerType: 'mouse', pointerId: 1, button: 0, buttons: 1, clientX: 50 };
    firePointer.down(source, { ...pointer, clientY: 50, timeStamp: 1 });
    await flushRaf();
    firePointer.move(source, { ...pointer, clientY: 220, timeStamp: 100 });
    await flushRaf();
    expect(changed).toHaveBeenCalledTimes(1);
    const first = changed.mock.lastCall![0];
    expect(first.target.getLocalPoint()).toEqual({ x: 0.5, y: 0.2 });
    expect(first.target.getSnappedLocalPoint().y).toBe(0.25);
    expect(changed.mock.lastCall![1].previousTarget).toBeNull();

    firePointer.move(source, { ...pointer, clientY: 430, timeStamp: 200 });
    await flushRaf();
    expect(changed).toHaveBeenCalledTimes(2);
    expect(changed.mock.lastCall![0].target.getLocalPoint().y).toBe(0.3);
    expect(changed.mock.lastCall![1].previousTarget).toBe(first.target);

    firePointer.up(source, { ...pointer, buttons: 0, clientY: 480, timeStamp: 300 });
    expect(ended).toHaveBeenCalledTimes(1);
    expect(ended.mock.lastCall![0].target.getLocalPoint().y).toBe(0.8);
    expect(ended.mock.lastCall![0].target.getSnappedLocalPoint().y).toBe(0.75);
  });
});
