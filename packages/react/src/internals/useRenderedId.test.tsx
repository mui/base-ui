import * as React from 'react';
import { expect, vi } from 'vitest';
import { createRenderer } from '#test-utils';
import { useRenderedId } from './useRenderedId';

describe('useRenderedId', () => {
  const { render } = createRenderer();

  function Test(props: {
    fallbackId?: string | undefined;
    id?: string | undefined;
    renderedId?: string | undefined;
    onIdChange: (id: string | undefined) => void;
  }) {
    const { fallbackId, id, renderedId, onIdChange } = props;

    // eslint-disable-next-line testing-library/render-result-naming-convention
    const elementRef = useRenderedId(onIdChange, fallbackId, id != null);
    return <div ref={elementRef} id={renderedId ?? id ?? fallbackId} />;
  }

  it('does not publish a generated fallback as an override', async () => {
    const onIdChange = vi.fn();

    await render(<Test fallbackId="fallback" onIdChange={onIdChange} />);

    expect(onIdChange).toHaveBeenLastCalledWith(undefined);
  });

  it('publishes the id that lands on the rendered element', async () => {
    const onIdChange = vi.fn();

    await render(
      <Test
        fallbackId="fallback"
        id="component-id"
        renderedId="render-id"
        onIdChange={onIdChange}
      />,
    );

    expect(onIdChange).toHaveBeenLastCalledWith('render-id');
  });

  it('clears an explicit id after it is removed', async () => {
    const onIdChange = vi.fn();
    const { rerender } = await render(
      <Test fallbackId="fallback" id="component-id" onIdChange={onIdChange} />,
    );

    expect(onIdChange).toHaveBeenLastCalledWith('component-id');

    await rerender(<Test fallbackId="fallback" onIdChange={onIdChange} />);

    expect(onIdChange).toHaveBeenLastCalledWith(undefined);
  });
});
