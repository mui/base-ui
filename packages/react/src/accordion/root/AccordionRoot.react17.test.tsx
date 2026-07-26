import { expect, vi } from 'vitest';
import * as React from 'react';
import { screen, waitFor } from '@mui/internal-test-utils';
import { Accordion } from '@base-ui/react/accordion';
import { createRenderer } from '#test-utils';

vi.mock('@base-ui/utils/safeReact', async (importOriginal) => {
  const original = await importOriginal<typeof import('@base-ui/utils/safeReact')>();

  return {
    SafeReact: {
      ...original.SafeReact,
      useId: undefined,
    },
  };
});

describe('<Accordion.Root /> with the React 17 id fallback', () => {
  const { render } = createRenderer();

  it('registers generated part ids only while their owners are mounted', async () => {
    function App({ parts }: { parts: 'both' | 'trigger' | 'panel' }) {
      return (
        <Accordion.Root defaultValue={[0]}>
          <Accordion.Item value={0}>
            <Accordion.Header>
              {parts !== 'panel' && <Accordion.Trigger>Trigger</Accordion.Trigger>}
            </Accordion.Header>
            {parts !== 'trigger' && <Accordion.Panel>Panel</Accordion.Panel>}
          </Accordion.Item>
        </Accordion.Root>
      );
    }

    const { rerender } = await render(<App parts="both" />);

    let trigger = screen.getByRole('button', { name: 'Trigger' });
    let panel = screen.getByText('Panel');
    await waitFor(() => {
      expect(trigger.id).not.toBe('');
    });
    await waitFor(() => {
      expect(panel).toHaveAttribute('aria-labelledby', trigger.id);
    });

    await rerender(<App parts="panel" />);
    expect(screen.getByText('Panel')).not.toHaveAttribute('aria-labelledby');

    await rerender(<App parts="both" />);
    trigger = screen.getByRole('button', { name: 'Trigger' });
    panel = screen.getByText('Panel');
    await waitFor(() => {
      expect(panel).toHaveAttribute('aria-labelledby', trigger.id);
    });

    await rerender(<App parts="trigger" />);
    expect(screen.getByRole('button', { name: 'Trigger' })).not.toHaveAttribute('aria-controls');

    await rerender(<App parts="both" />);
    trigger = screen.getByRole('button', { name: 'Trigger' });
    panel = screen.getByText('Panel');
    await waitFor(() => {
      expect(trigger).toHaveAttribute('aria-controls', panel.id);
    });
  });
});
