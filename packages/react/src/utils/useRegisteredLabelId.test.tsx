import * as React from 'react';
import { expect, describe, it } from 'vitest';
import { screen } from '@mui/internal-test-utils';
import { createRenderer } from '#test-utils';
import { useRegisteredLabelId } from './useRegisteredLabelId';

describe('useRegisteredLabelId', () => {
  const { render } = createRenderer();

  function Label({
    id,
    render,
    setLabelId,
    children,
  }: {
    id: string;
    render?: React.ReactElement | undefined;
    setLabelId: React.Dispatch<React.SetStateAction<string | undefined>>;
    children: React.ReactNode;
  }) {
    const registeredId = useRegisteredLabelId({ id, render }, setLabelId);
    return <span id={registeredId}>{children}</span>;
  }

  function Test({ labels }: { labels: 'old' | 'both' | 'new' }) {
    const [labelId, setLabelId] = React.useState<string | undefined>();

    return (
      <React.Fragment>
        <div data-testid="target" aria-labelledby={labelId} />
        {labels !== 'new' && (
          <Label key="old" id="old-label" setLabelId={setLabelId}>
            Old
          </Label>
        )}
        {labels !== 'old' && (
          <Label key="new" id="new-label" setLabelId={setLabelId}>
            New
          </Label>
        )}
      </React.Fragment>
    );
  }

  it('does not let an older label cleanup clear a newer label', async () => {
    const { rerender } = await render(<Test labels="old" />);

    const target = screen.getByTestId('target');
    expect(target).toHaveAttribute('aria-labelledby', 'old-label');

    await rerender(<Test labels="both" />);
    expect(target).toHaveAttribute('aria-labelledby', 'new-label');

    await rerender(<Test labels="new" />);
    expect(target).toHaveAttribute('aria-labelledby', 'new-label');
  });

  function RenderTest({
    oldRender,
    withNew = true,
  }: {
    oldRender?: React.ReactElement | undefined;
    withNew?: boolean | undefined;
  }) {
    const [labelId, setLabelId] = React.useState<string | undefined>();

    return (
      <React.Fragment>
        <div data-testid="target" aria-labelledby={labelId} />
        <Label id="old-label" render={oldRender} setLabelId={setLabelId}>
          Old
        </Label>
        {withNew && (
          <Label id="new-label" setLabelId={setLabelId}>
            New
          </Label>
        )}
      </React.Fragment>
    );
  }

  it('releases its id when the render element removes the id', async () => {
    const { setProps } = await render(<RenderTest withNew={false} />);

    const target = screen.getByTestId('target');
    expect(target).toHaveAttribute('aria-labelledby', 'old-label');

    await setProps({ oldRender: <span id={undefined} /> });
    expect(target).not.toHaveAttribute('aria-labelledby');
  });

  it('does not let an older label without an id clear a newer label', async () => {
    const { setProps } = await render(<RenderTest />);

    const target = screen.getByTestId('target');
    expect(target).toHaveAttribute('aria-labelledby', 'new-label');

    await setProps({ oldRender: <span id={undefined} /> });
    expect(target).toHaveAttribute('aria-labelledby', 'new-label');
  });
});
