import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { createDndRenderer, firePointer } from '#test-utils';
import { Draggable } from '@base-ui/react/draggable';
import { lift, dragOver, drop, cancel, setupDragEngineTests } from '../../../test/dnd';

setupDragEngineTests();
const kind = Draggable.createKind<string>('collision-test');
const objectKind = Draggable.createKind<{ id: string }>('collision-object-test');

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

  it('keeps group ownership when the source unmounts during pickup', async () => {
    const started = vi.fn();
    const ended = vi.fn();
    function Example() {
      const [visible, setVisible] = React.useState(true);
      return (
        <Draggable.CollisionProvider kind={kind} onMoveStart={started} onMoveEnd={ended}>
          {visible && (
            <Draggable.Root
              kind={kind}
              payload="a"
              data-testid="a"
              onMoveStart={() => ReactDOM.flushSync(() => setVisible(false))}
            >
              <Draggable.Preview disabled />
            </Draggable.Root>
          )}
          <Draggable.Root kind={kind} payload="b" data-testid="b">
            <Draggable.Preview disabled />
          </Draggable.Root>
        </Draggable.CollisionProvider>
      );
    }
    await renderDnd(<Example />);
    const a = screen.getByTestId('a');
    const b = screen.getByTestId('b');
    vi.spyOn(b, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 100, 100, 100));
    await lift(a);
    expect(started).toHaveBeenCalledOnce();
    expect(screen.queryByTestId('a')).toBeNull();
    await dragOver(b, { clientY: 180 });
    firePointer.up(b, { pointerId: 1, pointerType: 'mouse', clientY: 180, timeStamp: 1000 });
    expect(ended).toHaveBeenCalledOnce();
    expect(ended.mock.lastCall?.[0].collision).toMatchObject({
      target: { payload: 'b' },
      placement: 'after',
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

  it('replays onMoveStart to a group that only becomes involved through a collision', async () => {
    const targetStart = vi.fn();
    const targetChange = vi.fn();
    const targetEnd = vi.fn();
    const order: string[] = [];
    await renderDnd(
      <React.Fragment>
        <Draggable.CollisionProvider kind={kind}>
          <Draggable.Root kind={kind} payload="a" data-testid="a">
            <Draggable.Preview disabled />
          </Draggable.Root>
        </Draggable.CollisionProvider>
        <Draggable.CollisionProvider
          kind={kind}
          onMoveStart={(event) => {
            order.push('start');
            targetStart(event);
          }}
          onCollisionChange={(event) => {
            order.push('change');
            targetChange(event);
          }}
          onMoveEnd={(event) => {
            order.push('end');
            targetEnd(event);
          }}
        >
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
    // Not involved yet: the start is held back rather than delivered up front.
    expect(targetStart).not.toHaveBeenCalled();
    await dragOver(b, { clientY: 180 });
    expect(targetStart).toHaveBeenCalledTimes(1);
    expect(targetStart.mock.calls[0][0].source.element).toBe(a);
    cancel();
    expect(targetEnd).toHaveBeenCalledTimes(1);
    expect(order).toEqual(['start', 'change', 'change', 'end']);
  });

  it('does not replay onMoveStart to a group the drag never reached', async () => {
    const otherStart = vi.fn();
    const otherEnd = vi.fn();
    await renderDnd(
      <React.Fragment>
        <Draggable.CollisionProvider kind={kind}>
          <Draggable.Root kind={kind} payload="a" data-testid="a">
            <Draggable.Preview disabled />
          </Draggable.Root>
        </Draggable.CollisionProvider>
        <Draggable.CollisionProvider kind={kind} onMoveStart={otherStart} onMoveEnd={otherEnd}>
          <Draggable.Root kind={kind} payload="b" data-testid="b">
            <Draggable.Preview disabled />
          </Draggable.Root>
        </Draggable.CollisionProvider>
      </React.Fragment>,
    );
    const a = screen.getByTestId('a');
    await lift(a);
    cancel();
    expect(otherStart).not.toHaveBeenCalled();
    expect(otherEnd).not.toHaveBeenCalled();
  });

  it('keeps a disabled source as a destination', async () => {
    const changed = vi.fn();
    await renderDnd(
      <Draggable.CollisionProvider kind={kind} onCollisionChange={changed}>
        <Draggable.Root kind={kind} payload="a" data-testid="a">
          <Draggable.Preview disabled />
        </Draggable.Root>
        <Draggable.Root kind={kind} payload="b" data-testid="b" disabled>
          <Draggable.Preview disabled />
        </Draggable.Root>
        <Draggable.Root kind={kind} payload="c" data-testid="c">
          <Draggable.Preview disabled />
        </Draggable.Root>
      </Draggable.CollisionProvider>,
    );
    const {
      items: [a, b],
    } = measure();
    await lift(a);
    await dragOver(b, { clientY: 180 });
    expect(changed.mock.lastCall?.[0].collision).toMatchObject({
      target: { payload: 'b' },
      placement: 'after',
    });
  });

  it('falls back to the midpoint when a new item arrives under a stationary pointer', async () => {
    const changed = vi.fn();
    await renderDnd(
      <Draggable.CollisionProvider kind={kind} placement="direction" onCollisionChange={changed}>
        <Items />
      </Draggable.CollisionProvider>,
    );
    const {
      items: [a, b, c],
    } = measure();
    await lift(a);
    await dragOver(b, { clientY: 120 });
    expect(changed.mock.lastCall?.[0].collision.placement).toBe('after');
    // Same pointer position, different item: what auto-scroll produces when the
    // list moves under a held pointer. There is no travel to read, so the item's
    // midpoint decides instead of the destination being dropped.
    await dragOver(c, { clientY: 120 });
    expect(changed.mock.lastCall?.[0].collision).toMatchObject({
      target: { payload: 'c' },
      placement: 'before',
    });
  });

  it('does not re-register participants when an inline collisionElement changes identity', async () => {
    const changed = vi.fn();
    function List() {
      const [, rerender] = React.useState(0);
      return (
        <Draggable.CollisionProvider
          kind={kind}
          onCollisionChange={(event) => {
            changed(event);
            rerender((count) => count + 1);
          }}
        >
          <div data-testid="row-a">
            <Draggable.Root
              kind={kind}
              payload="a"
              data-testid="a"
              collisionElement={(element) => element.parentElement!}
            >
              <Draggable.Preview disabled />
            </Draggable.Root>
          </div>
          <div data-testid="row-b">
            <Draggable.Root
              kind={kind}
              payload="b"
              data-testid="b"
              collisionElement={(element) => element.parentElement!}
            >
              <Draggable.Preview disabled />
            </Draggable.Root>
          </div>
        </Draggable.CollisionProvider>
      );
    }
    await renderDnd(<List />);
    const b = screen.getByTestId('row-b');
    b.getBoundingClientRect = () => new DOMRect(0, 100, 100, 100);
    await lift(screen.getByTestId('a'));
    await dragOver(b, { clientY: 180 });
    // The change re-rendered the list with new resolver identities. A
    // re-registration of the hovered row would have reported a leave (`null`)
    // and then the same collision again.
    await dragOver(b, { clientY: 181 });
    expect(changed).toHaveBeenCalledTimes(1);
    expect(changed.mock.calls[0][0].collision.placement).toBe('after');
    expect(screen.getByTestId('b')).toHaveAttribute('data-collision-after');
  });

  it('warns when a getPayload source has no collisionPayload', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      await renderDnd(
        <Draggable.CollisionProvider kind={kind}>
          <Draggable.Root kind={kind} getPayload={() => 'a'} data-testid="a">
            <Draggable.Preview disabled />
          </Draggable.Root>
        </Draggable.CollisionProvider>,
      );
      // `warn()` dedupes per message process-wide, so this must be the first
      // such mount of the file.
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy.mock.calls[0][0]).toMatch(/`getPayload` without `collisionPayload`/);
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('reorders live from onCollisionChange and keeps resolving after the re-render', async () => {
    const initial = ['a', 'b', 'c'];
    function LiveList() {
      const [items, setItems] = React.useState(initial);
      return (
        <Draggable.CollisionProvider
          kind={kind}
          placement="direction"
          onCollisionChange={({ source, collision }) => {
            if (!collision) {
              return;
            }
            setItems((current) => {
              const remaining = current.filter((item) => item !== source.payload);
              const index = remaining.indexOf(collision.target.payload);
              remaining.splice(
                index + (collision.placement === 'after' ? 1 : 0),
                0,
                source.payload,
              );
              return remaining;
            });
          }}
          onMoveEnd={(event) => {
            if (event.canceled) {
              setItems(initial);
            }
          }}
        >
          <div data-testid="list">
            {items.map((item) => (
              <Draggable.Root key={item} kind={kind} payload={item} data-testid={item}>
                <Draggable.Preview disabled />
              </Draggable.Root>
            ))}
          </div>
        </Draggable.CollisionProvider>
      );
    }
    await renderDnd(<LiveList />);
    const order = () =>
      Array.from(screen.getByTestId('list').children).map(
        (child) => (child as HTMLElement).dataset.testid,
      );
    const {
      items: [a, b, c],
    } = measure();
    await lift(a);
    await dragOver(b, { clientY: 120 });
    expect(order()).toEqual(['b', 'a', 'c']);
    // The moved rows still resolve after React re-keyed the list.
    await dragOver(c, { clientY: 220 });
    expect(order()).toEqual(['b', 'c', 'a']);
    cancel();
    expect(order()).toEqual(['a', 'b', 'c']);
  });

  it('dedupes object payloads through getItemId', async () => {
    const changed = vi.fn();
    function ObjectList() {
      const [, rerender] = React.useState(0);
      return (
        <Draggable.CollisionProvider
          kind={objectKind}
          getItemId={(payload) => payload.id}
          onCollisionChange={(event) => {
            changed(event);
            rerender((count) => count + 1);
          }}
        >
          {['a', 'b'].map((id) => (
            // Inline payload objects: a new identity on every render.
            <Draggable.Root key={id} kind={objectKind} payload={{ id }} data-testid={id}>
              <Draggable.Preview disabled />
            </Draggable.Root>
          ))}
        </Draggable.CollisionProvider>
      );
    }
    await renderDnd(<ObjectList />);
    const a = screen.getByTestId('a');
    const b = screen.getByTestId('b');
    b.getBoundingClientRect = () => new DOMRect(0, 100, 100, 100);
    await lift(a);
    await dragOver(b, { clientY: 180 });
    await dragOver(b, { clientY: 181 });
    await dragOver(b, { clientY: 182 });
    expect(changed).toHaveBeenCalledTimes(1);
    expect(changed.mock.calls[0][0].collision.target.payload).toEqual({ id: 'b' });
  });

  it('completes a drop onto the dragged item itself with no collision', async () => {
    const ended = vi.fn();
    await renderDnd(
      <Draggable.CollisionProvider kind={kind} onMoveEnd={ended}>
        <Items />
      </Draggable.CollisionProvider>,
    );
    const {
      items: [a],
    } = measure();
    await lift(a);
    await dragOver(a, { clientY: 80 });
    drop(a, { clientY: 80 });
    expect(ended).toHaveBeenCalledTimes(1);
    expect(ended.mock.calls[0][1].reason).toBe('drop');
    expect(ended.mock.calls[0][0]).toMatchObject({ canceled: false, collision: null });
  });

  it("vetoes the whole target stack when canCollide returns 'reject'", async () => {
    const changed = vi.fn();
    const containerDrop = vi.fn();
    await renderDnd(
      <Draggable.Target accept={kind} data-testid="container" onDraggableDrop={containerDrop}>
        <Draggable.CollisionProvider
          kind={kind}
          onCollisionChange={changed}
          canCollide={({ target }) => (target === 'b' ? 'reject' : true)}
        >
          <Items />
        </Draggable.CollisionProvider>
      </Draggable.Target>,
    );
    const {
      items: [a, b],
    } = measure();
    await lift(a);
    await dragOver(b, { clientY: 180 });
    expect(changed.mock.lastCall?.[0].collision ?? null).toBeNull();
    expect(b).not.toHaveAttribute('data-collision-after');
    drop(b, { clientY: 180 });
    // The ancestor target is vetoed too, not handed the drop.
    expect(containerDrop).not.toHaveBeenCalled();
  });

  it('clears the marker on drop', async () => {
    await renderDnd(
      <Draggable.CollisionProvider kind={kind}>
        <Items />
      </Draggable.CollisionProvider>,
    );
    const {
      items: [a, b],
    } = measure();
    await lift(a);
    await dragOver(b, { clientY: 180 });
    expect(b).toHaveAttribute('data-collision-after');
    drop(b, { clientY: 180 });
    expect(b).not.toHaveAttribute('data-collision-after');
    expect(a).not.toHaveAttribute('data-collision-before');
  });

  it('resolves horizontal placement in LTR reading order', async () => {
    const ended = vi.fn();
    await renderDnd(
      <Draggable.CollisionProvider kind={kind} orientation="horizontal" onMoveEnd={ended}>
        <Items />
      </Draggable.CollisionProvider>,
    );
    const {
      items: [a, b],
    } = measure();
    b.getBoundingClientRect = () => new DOMRect(100, 0, 100, 100);
    await lift(a);
    await dragOver(b, { clientX: 180, clientY: 50 });
    drop(b, { clientX: 180, clientY: 50 });
    expect(ended.mock.lastCall?.[0].collision.placement).toBe('after');
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
          <Draggable.Root kind={kind} payload="b" data-testid="b" collisionElement={rowElement}>
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
    // The marker is root state, so it lands on the root, not on the measured row.
    expect(screen.getByTestId('b')).toHaveAttribute('data-collision-after');
    expect(b).not.toHaveAttribute('data-collision-after');
    cancel();
    expect(screen.getByTestId('b')).not.toHaveAttribute('data-collision-after');
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
