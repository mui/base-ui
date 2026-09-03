import * as React from 'react';
import { expect, vi, describe, it } from 'vitest';
import { createRenderer } from '#test-utils';
import { resolveRenderedId, useRenderedId } from './resolveRenderedId';

describe('resolveRenderedId', () => {
  it('falls back to the generated id when nothing else is given', () => {
    expect(resolveRenderedId({}, 'fallback')).toBe('fallback');
  });

  it('prefers an explicit id prop', () => {
    expect(resolveRenderedId({ id: 'explicit' }, 'fallback')).toBe('explicit');
  });

  it('treats an explicitly empty id prop as no id', () => {
    expect(resolveRenderedId({ id: '' }, 'fallback')).toBe('');
  });

  it("prefers a render element's own id", () => {
    expect(resolveRenderedId({ id: 'explicit', render: <div id="rendered" /> }, 'fallback')).toBe(
      'rendered',
    );
  });

  it('treats an undefined id on a render element as no id', () => {
    expect(resolveRenderedId({ render: <div id={undefined} /> }, 'fallback')).toBe('');
  });

  it('ignores a render element that does not set an id', () => {
    expect(resolveRenderedId({ id: 'explicit', render: <div /> }, 'fallback')).toBe('explicit');
  });

  it('cannot see an id applied by a render function', () => {
    // Render callbacks are opaque, so they must apply the id they are handed.
    const render = (props: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props} id="rendered" />
    );
    expect(resolveRenderedId({ render }, 'fallback')).toBe('fallback');
  });
});

describe('useRenderedId', () => {
  const { render } = createRenderer();

  function Test(props: {
    defaultId?: string | undefined;
    id?: string | undefined;
    renderProp?: React.ReactElement | undefined;
    onIdChange: (id: string | undefined) => void;
  }) {
    const { defaultId, id, renderProp, onIdChange } = props;
    const [resolvedId, ref] = useRenderedId({ id, render: renderProp }, defaultId, onIdChange);
    return <div ref={ref} id={resolvedId || undefined} />;
  }

  it('does not publish a generated fallback as an override', async () => {
    const onIdChange = vi.fn();

    await render(<Test defaultId="fallback" onIdChange={onIdChange} />);

    expect(onIdChange).toHaveBeenLastCalledWith(undefined);
  });

  it('publishes the id that lands on the rendered element', async () => {
    const onIdChange = vi.fn();

    await render(
      <Test
        defaultId="fallback"
        id="component-id"
        renderProp={<div id="render-id" />}
        onIdChange={onIdChange}
      />,
    );

    expect(onIdChange).toHaveBeenLastCalledWith('render-id');
  });

  it('publishes an empty string for an explicitly empty id', async () => {
    const onIdChange = vi.fn();

    await render(
      <Test defaultId="fallback" renderProp={<div id={undefined} />} onIdChange={onIdChange} />,
    );

    expect(onIdChange).toHaveBeenLastCalledWith('');
  });

  it('clears an explicit id after it is removed', async () => {
    const onIdChange = vi.fn();
    const { rerender } = await render(
      <Test defaultId="fallback" id="component-id" onIdChange={onIdChange} />,
    );

    expect(onIdChange).toHaveBeenLastCalledWith('component-id');

    await rerender(<Test defaultId="fallback" onIdChange={onIdChange} />);

    expect(onIdChange).toHaveBeenLastCalledWith(undefined);
  });

  it('releases the override when the element unmounts', async () => {
    const onIdChange = vi.fn();

    function App(props: { mounted: boolean }) {
      return props.mounted ? (
        <Test defaultId="fallback" id="explicit" onIdChange={onIdChange} />
      ) : null;
    }

    const { setProps } = await render(<App mounted />);
    expect(onIdChange).toHaveBeenLastCalledWith('explicit');

    onIdChange.mockClear();
    await setProps({ mounted: false });

    expect(onIdChange).toHaveBeenLastCalledWith(undefined);
  });
});
