import * as React from 'react';
import { expect } from 'chai';
import { act, createRenderer } from '@mui/internal-test-utils';
import { usePreviousValue } from './usePreviousValue';

interface TestComponentProps {
  value: any;
  unrelatedProp?: any;
  children: (previous: any) => React.ReactNode;
}

function TestComponent({ value, children }: TestComponentProps) {
  const previous = usePreviousValue(value);
  return children(previous);
}

describe('usePrevious', () => {
  const { render } = createRenderer();

  it('should return null on the first render', () => {
    let previousValue: any;
    render(
      <TestComponent value="first">
        {(previous) => {
          previousValue = previous;
          return null;
        }}
      </TestComponent>,
    );

    expect(previousValue).to.equal(null);
  });

  it('should return the previous value on subsequent renders', () => {
    let previousValue: any;
    const { setProps } = render(
      <TestComponent value="first">
        {(previous) => {
          previousValue = previous;
          return null;
        }}
      </TestComponent>,
    );

    expect(previousValue).to.equal(null);

    setProps({ value: 'second' });
    expect(previousValue).to.equal('first');

    setProps({ value: 'third' });
    expect(previousValue).to.equal('second');
  });

  it('should work with primitive values', () => {
    let previousValue: any;
    const { setProps } = render(
      <TestComponent value={42}>
        {(previous) => {
          previousValue = previous;
          return null;
        }}
      </TestComponent>,
    );

    expect(previousValue).to.equal(null);

    setProps({ value: 100 });
    expect(previousValue).to.equal(42);

    setProps({ value: true });
    expect(previousValue).to.equal(100);

    setProps({ value: false });
    expect(previousValue).to.equal(true);
  });

  it('should ignore renders where the value does not change', () => {
    let previousValue: any;
    const { setProps } = render(
      <TestComponent value="stable">
        {(previous) => {
          previousValue = previous;
          return null;
        }}
      </TestComponent>,
    );

    expect(previousValue).to.equal(null);

    setProps({ unrelatedProp: 1 });
    expect(previousValue).to.equal(null);

    setProps({ unrelatedProp: 2 });
    expect(previousValue).to.equal(null);
  });

  it('should work with object values', () => {
    let previousValue: any;
    const obj1 = { a: 1 };
    const obj2 = { b: 2 };
    const obj3 = { c: 3 };

    const { setProps } = render(
      <TestComponent value={obj1}>
        {(previous) => {
          previousValue = previous;
          return null;
        }}
      </TestComponent>,
    );

    expect(previousValue).to.equal(null);

    setProps({ value: obj2 });
    expect(previousValue).to.equal(obj1);

    setProps({ value: obj3 });
    expect(previousValue).to.equal(obj2);
  });

  it('should handle undefined and null values', () => {
    let previousValue: any;
    const { setProps } = render(
      <TestComponent value={undefined}>
        {(previous) => {
          previousValue = previous;
          return null;
        }}
      </TestComponent>,
    );

    expect(previousValue).to.equal(null);

    setProps({ value: null });
    expect(previousValue).to.equal(undefined);

    setProps({ value: 'defined' });
    expect(previousValue).to.equal(null);

    setProps({ value: undefined });
    expect(previousValue).to.equal('defined');
  });

  it('should handle rapid value changes', () => {
    let previousValue: any;
    const { setProps } = render(
      <TestComponent value="initial">
        {(previous) => {
          previousValue = previous;
          return null;
        }}
      </TestComponent>,
    );

    expect(previousValue).to.equal(null);

    act(() => {
      setProps({ value: 'first' });
      setProps({ value: 'second' });
      setProps({ value: 'third' });
    });

    // With React batching, only the final value 'third' causes a render,
    // so the previous value should be 'initial' (from the first render)
    expect(previousValue).to.equal('initial');
  });

  it('should maintain type safety', () => {
    let previousValue: string | null = null;
    const { setProps } = render(
      <TestComponent value="hello">
        {(previous: string | null) => {
          previousValue = previous;
          return null;
        }}
      </TestComponent>,
    );

    expect(previousValue).to.equal(null);

    setProps({ value: 'world' });
    expect(previousValue).to.equal('hello');
    expect(typeof previousValue).to.equal('string');
  });
});
