import * as React from 'react';
import { expect } from 'vitest';
import { screen } from '@mui/internal-test-utils';
import { createRenderer } from '#test-utils';
import { useRegisteredLabelId } from './useRegisteredLabelId';

describe('useRegisteredLabelId', () => {
  const { render } = createRenderer();

  function Label({
    id,
    setLabelId,
    children,
  }: {
    id: string;
    setLabelId: React.Dispatch<React.SetStateAction<string | undefined>>;
    children: React.ReactNode;
  }) {
    const registeredId = useRegisteredLabelId(id, setLabelId);
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
});
