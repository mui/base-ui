import * as React from 'react';
import { expect } from 'chai';
import { spy } from 'sinon';
import { act, createRenderer } from '@mui/internal-test-utils';
import { EventEmitter } from '@base-ui-components/utils/EventEmitter';

type TestEventMap = {
  foo: [count: number, label: string];
  empty: [];
};

describe('EventEmitter', () => {
  const { render } = createRenderer();

  it('calls subscribed handlers with arguments', () => {
    const emitter = new EventEmitter<TestEventMap>();
    const handler = spy();

    emitter.on('foo', handler as any);
    emitter.emit('foo', 1, 'a');

    expect(handler.callCount).to.equal(1);
    expect(handler.calledWith(1, 'a')).to.equal(true);
  });

  it('off unsubscribes a handler', () => {
    const emitter = new EventEmitter<TestEventMap>();
    const handler = spy();

    emitter.on('foo', handler as any);
    emitter.emit('foo', 1, 'a');
    emitter.off('foo', handler as any);
    emitter.emit('foo', 2, 'b');

    expect(handler.callCount).to.equal(1);
  });

  it('disposer returned from on() unsubscribes', () => {
    const emitter = new EventEmitter<TestEventMap>();
    const handler = spy();

    const off = emitter.on('foo', handler as any);
    off();
    emitter.emit('foo', 3, 'c');

    expect(handler.callCount).to.equal(0);
  });

  it('useEvent subscribes and cleans up on unmount', () => {
    const emitter = new EventEmitter<TestEventMap>();
    const handler = spy();

    function Test() {
      emitter.useEvent('foo', (n, s) => handler(n, s));
      return null;
    }

    const { unmount } = render(<Test />, { strict: false });

    act(() => {
      emitter.emit('foo', 10, 'x');
    });
    expect(handler.callCount).to.equal(1);
    expect(handler.calledWith(10, 'x')).to.equal(true);

    unmount();

    act(() => {
      emitter.emit('foo', 11, 'y');
    });
    expect(handler.callCount).to.equal(1);
  });

  it('preserves subscription order across multiple handlers', () => {
    const emitter = new EventEmitter<TestEventMap>();
    const calls: string[] = [];

    const h1 = () => calls.push('first');
    const h2 = () => calls.push('second');
    const h3 = () => calls.push('third');

    emitter.on('empty', h1);
    emitter.on('empty', h2);
    emitter.on('empty', h3);

    emitter.emit('empty');
    expect(calls).to.deep.equal(['first', 'second', 'third']);
  });

  it('emitting with no subscribers is a no-op', () => {
    const emitter = new EventEmitter<TestEventMap>();
    expect(() => emitter.emit('foo', 123, 'z')).not.to.throw();
    expect(() => emitter.emit('empty')).not.to.throw();
  });

  it('off is idempotent and safe for unknown handlers', () => {
    const emitter = new EventEmitter<TestEventMap>();
    const handler = spy();
    const another = spy();

    emitter.on('foo', handler as any);
    // Remove a handler that was never added
    emitter.off('foo', another as any);
    // Remove the actual handler twice
    emitter.off('foo', handler as any);
    emitter.off('foo', handler as any);

    emitter.emit('foo', 5, 'q');
    expect(handler.callCount).to.equal(0);
    expect(another.callCount).to.equal(0);
  });
});
