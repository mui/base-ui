import * as React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { createDndRenderer } from '#test-utils';
import { Draggable } from '@base-ui/react/draggable';
import { lift, dragOver, drop, cancel, setupDragEngineTests } from '../../../test/dnd';

setupDragEngineTests();
const kind = Draggable.createKind<string>('collision-test');

function Items() {
  return (
    <React.Fragment>
      <Draggable.Root kind={kind} payload="a" data-testid="a">
        <Draggable.Preview disabled />
      </Draggable.Root>
      <Draggable.Root kind={kind} payload="b" data-testid="b">
        <Draggable.Preview disabled />
      </Draggable.Root>
      <Draggable.Root kind={kind} payload="c" data-testid="c">
        <Draggable.Preview disabled />
      </Draggable.Root>
    </React.Fragment>
  );
}

function measure() {
  const items = ['a', 'b', 'c'].map((id) => screen.getByTestId(id));
  const spies = items.map((element, index) =>
    vi
      .spyOn(element, 'getBoundingClientRect')
      .mockReturnValue(new DOMRect(0, index * 100, 100, 100)),
  );
  return { items, spies };
}

describe('Draggable.CollisionProvider', () => {
  const { renderDnd } = createDndRenderer();

  it('resolves placement without explicit targets and only reports changed destinations', async () => {
    const changed = vi.fn();
    const ended = vi.fn();
    await renderDnd(
      <Draggable.CollisionProvider kind={kind} onCollisionChange={changed} onMoveEnd={ended}>
        <Items />
      </Draggable.CollisionProvider>,
    );
    const {
      items: [a, b],
      spies,
    } = measure();
    await lift(a);
    spies.forEach((spy) => spy.mockClear());
    await dragOver(b, { clientY: 120 });
    expect(changed.mock.lastCall?.[0].collision).toMatchObject({
      target: { payload: 'b' },
      placement: 'before',
    });
    const calls = changed.mock.calls.length;
    await dragOver(b, { clientY: 130 });
    expect(changed).toHaveBeenCalledTimes(calls);
    expect(spies[2]).not.toHaveBeenCalled();
    await dragOver(b, { clientY: 180 });
    expect(changed.mock.lastCall?.[0].collision.placement).toBe('after');
    drop(b, { clientY: 120 });
    expect(ended.mock.lastCall?.[0].dropTarget?.element).toBe(b);
    expect(ended.mock.lastCall?.[0]).toMatchObject({
      canceled: false,
      collision: { target: { payload: 'b' }, placement: 'before' },
    });
  });

  it('reports no final collision on cancellation', async () => {
    const ended = vi.fn();
    await renderDnd(
      <Draggable.CollisionProvider kind={kind} onMoveEnd={ended}>
        <Items />
      </Draggable.CollisionProvider>,
    );
    const {
      items: [a, b],
    } = measure();
    await lift(a);
    await dragOver(b, { clientY: 180 });
    cancel();
    expect(ended.mock.lastCall?.[0]).toMatchObject({ canceled: true, collision: null });
  });

  it('clears collisions on explicit nested targets without overriding their drop', async () => {
    const changed = vi.fn();
    const ended = vi.fn();
    const targetDrop = vi.fn();
    await renderDnd(
      <Draggable.CollisionProvider kind={kind} onCollisionChange={changed} onMoveEnd={ended}>
        <Items />
        <Draggable.Root kind={kind} payload="outer">
          <Draggable.Target accept={kind} data-testid="explicit" onDraggableDrop={targetDrop} />
        </Draggable.Root>
      </Draggable.CollisionProvider>,
    );
    const {
      items: [a, b],
    } = measure();
    await lift(a);
    await dragOver(b, { clientY: 180 });
    const target = screen.getByTestId('explicit');
    await dragOver(target);
    expect(changed.mock.lastCall?.[0].collision).toBeNull();
    drop(target);
    expect(targetDrop).toHaveBeenCalledOnce();
    expect(ended.mock.lastCall?.[0].collision).toBeNull();
  });

  it('preserves parent rejection', async () => {
    const ended = vi.fn();
    await renderDnd(
      <Draggable.CollisionProvider kind={kind} onMoveEnd={ended}>
        <Draggable.Root kind={kind} payload="a" data-testid="a">
          <Draggable.Preview disabled />
        </Draggable.Root>
        <Draggable.Target accept={kind} canDrop={() => 'reject'}>
          <Draggable.Root kind={kind} payload="b" data-testid="b">
            <Draggable.Preview disabled />
          </Draggable.Root>
        </Draggable.Target>
      </Draggable.CollisionProvider>,
    );
    const a = screen.getByTestId('a');
    const b = screen.getByTestId('b');
    await lift(a);
    await dragOver(b);
    drop(b);
    expect(ended.mock.lastCall?.[0]).toMatchObject({ dropTarget: null, collision: null });
  });

  it('supports cross-provider drops while only the destination resolves a collision', async () => {
    const sourceEnd = vi.fn();
    const targetEnd = vi.fn();
    await renderDnd(
      <React.Fragment>
        <Draggable.CollisionProvider kind={kind} onMoveEnd={sourceEnd}>
          <Draggable.Root kind={kind} payload="a" data-testid="a">
            <Draggable.Preview disabled />
          </Draggable.Root>
        </Draggable.CollisionProvider>
        <Draggable.CollisionProvider kind={kind} onMoveEnd={targetEnd}>
          <Draggable.Root kind={kind} payload="b" data-testid="b">
            <Draggable.Preview disabled />
          </Draggable.Root>
        </Draggable.CollisionProvider>
      </React.Fragment>,
    );
    const a = screen.getByTestId('a');
    const b = screen.getByTestId('b');
    b.getBoundingClientRect = () => new DOMRect(0, 100, 100, 100);
    await lift(a);
    await dragOver(b, { clientY: 180 });
    drop(b, { clientY: 180 });
    expect(sourceEnd.mock.lastCall?.[0].collision).toBeNull();
    expect(targetEnd.mock.lastCall?.[0].collision).toMatchObject({
      target: { payload: 'b' },
      placement: 'after',
    });
  });

  it('resolves horizontal placement in RTL reading order', async () => {
    const ended = vi.fn();
    await renderDnd(
      <div dir="rtl">
        <Draggable.CollisionProvider kind={kind} orientation="horizontal" onMoveEnd={ended}>
          <Items />
        </Draggable.CollisionProvider>
      </div>,
    );
    const {
      items: [a, b],
    } = measure();
    // JSDOM does not inherit direction from the ancestor's dir attribute.
    b.style.direction = 'rtl';
    await lift(a);
    await dragOver(b, { clientX: 80, clientY: 120 });
    drop(b, { clientX: 80, clientY: 120 });
    expect(ended.mock.lastCall?.[0].collision.placement).toBe('before');
  });

  it('allows individual draggables to opt out', async () => {
    const ended = vi.fn();
    await renderDnd(
      <Draggable.CollisionProvider kind={kind} onMoveEnd={ended}>
        <Draggable.Root kind={kind} payload="a" data-testid="a">
          <Draggable.Preview disabled />
        </Draggable.Root>
        <Draggable.Root kind={kind} payload="b" collision={false} data-testid="b">
          <Draggable.Preview disabled />
        </Draggable.Root>
      </Draggable.CollisionProvider>,
    );
    await lift(screen.getByTestId('a'));
    drop(screen.getByTestId('b'));
    expect(ended.mock.lastCall?.[0]).toMatchObject({ dropTarget: null, collision: null });
  });
  it('captures the final placement before a source callback changes layout', async () => {
    const ended = vi.fn();
    let target: HTMLElement;
    await renderDnd(
      <Draggable.CollisionProvider kind={kind} onMoveEnd={ended}>
        <Draggable.Root
          kind={kind}
          payload="a"
          data-testid="a"
          onMoveEnd={() => {
            target.getBoundingClientRect = () => new DOMRect(0, 1000, 100, 100);
          }}
        >
          <Draggable.Preview disabled />
        </Draggable.Root>
        <Draggable.Root kind={kind} payload="b" data-testid="b">
          <Draggable.Preview disabled />
        </Draggable.Root>
      </Draggable.CollisionProvider>,
    );
    target = screen.getByTestId('b');
    target.getBoundingClientRect = () => new DOMRect(0, 100, 100, 100);
    await lift(screen.getByTestId('a'));
    drop(target, { clientY: 180 });
    expect(ended.mock.lastCall?.[0].collision.placement).toBe('after');
  });

  it('measures the configured row box and ignores the source row', async () => {
    const changed = vi.fn();
    const rowElement = (element: HTMLElement) => element.parentElement!;
    await renderDnd(
      <Draggable.CollisionProvider kind={kind} onCollisionChange={changed}>
        <div data-testid="row-a">
          <Draggable.Root kind={kind} payload="a" data-testid="a" collisionElement={rowElement}>
            <Draggable.Preview disabled />
          </Draggable.Root>
        </div>
        <div data-testid="row-b">
          <Draggable.Root kind={kind} payload="b" collisionElement={rowElement}>
            <Draggable.Preview disabled />
          </Draggable.Root>
        </div>
      </Draggable.CollisionProvider>,
    );
    const b = screen.getByTestId('row-b');
    b.getBoundingClientRect = () => new DOMRect(0, 100, 100, 100);
    await lift(screen.getByTestId('a'));
    await dragOver(screen.getByTestId('row-a'));
    expect(changed).not.toHaveBeenCalled();
    await dragOver(b, { clientY: 180 });
    expect(changed.mock.lastCall?.[0].collision.placement).toBe('after');
    expect(b).toHaveAttribute('data-collision-after');
    cancel();
    expect(b).not.toHaveAttribute('data-collision-after');
  });

  it('preserves direction when stationary and changes placement on reversal', async () => {
    const changed = vi.fn();
    await renderDnd(
      <Draggable.CollisionProvider kind={kind} placement="direction" onCollisionChange={changed}>
        <Items />
      </Draggable.CollisionProvider>,
    );
    const {
      items: [a, b],
    } = measure();
    await lift(a);
    await dragOver(b, { clientY: 120 });
    expect(changed.mock.lastCall?.[0].collision.placement).toBe('after');
    await dragOver(b, { clientY: 120 });
    expect(changed.mock.lastCall?.[0].collision.placement).toBe('after');
    await dragOver(b, { clientY: 110 });
    expect(changed.mock.lastCall?.[0].collision.placement).toBe('before');
  });

  it('re-resolves a changed predicate without pointer movement', async () => {
    const changed = vi.fn();
    const { rerender } = await renderDnd(
      <Draggable.CollisionProvider kind={kind} onCollisionChange={changed} canCollide={() => true}>
        <Items />
      </Draggable.CollisionProvider>,
    );
    const {
      items: [a, b],
    } = measure();
    await lift(a);
    await dragOver(b, { clientY: 180 });
    expect(b).toHaveAttribute('data-collision-after');
    await rerender(
      <Draggable.CollisionProvider kind={kind} onCollisionChange={changed} canCollide={() => false}>
        <Items />
      </Draggable.CollisionProvider>,
    );
    expect(changed.mock.lastCall?.[0].collision).toBeNull();
    expect(b).not.toHaveAttribute('data-collision-after');
  });

  it('does not call a pickup accessor to read destination identity', async () => {
    const pickup = vi.fn(() => 'b');
    const ended = vi.fn();
    await renderDnd(
      <Draggable.CollisionProvider kind={kind} onMoveEnd={ended}>
        <Draggable.Root kind={kind} payload="a" data-testid="a">
          <Draggable.Preview disabled />
        </Draggable.Root>
        <Draggable.Root kind={kind} getPayload={pickup} collisionPayload="b" data-testid="b">
          <Draggable.Preview disabled />
        </Draggable.Root>
      </Draggable.CollisionProvider>,
    );
    const b = screen.getByTestId('b');
    b.getBoundingClientRect = () => new DOMRect(0, 100, 100, 100);
    await lift(screen.getByTestId('a'));
    await dragOver(b, { clientY: 180 });
    drop(b, { clientY: 180 });
    expect(ended.mock.lastCall?.[0].collision.target.payload).toBe('b');
    expect(pickup).not.toHaveBeenCalled();
  });

  it('finds a matching group through nested providers of another kind', async () => {
    const otherKind = Draggable.createKind<string>('other-collision-kind');
    const outer = vi.fn();
    const inner = vi.fn();
    await renderDnd(
      <Draggable.CollisionProvider kind={kind} onMoveEnd={outer}>
        <Draggable.CollisionProvider kind={otherKind} onMoveEnd={inner}>
          <Items />
        </Draggable.CollisionProvider>
      </Draggable.CollisionProvider>,
    );
    const {
      items: [a, b],
    } = measure();
    await lift(a);
    drop(b, { clientY: 180 });
    expect(outer.mock.lastCall?.[0].collision.target.payload).toBe('b');
    expect(inner).not.toHaveBeenCalled();
  });
});
