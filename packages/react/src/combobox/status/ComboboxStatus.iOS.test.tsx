import { expect, vi } from 'vitest';
import { Combobox } from '@base-ui/react/combobox';
import { screen } from '@mui/internal-test-utils';
import { createRenderer } from '#test-utils';
import { INITIAL_LIVE_REGION_TEXT_MUTATION_RESET_DELAY } from '../utils/useInitialLiveRegionTextMutation';

vi.mock('@base-ui/utils/detectBrowser', async () => {
  const actual = await vi.importActual<typeof import('@base-ui/utils/detectBrowser')>(
    '@base-ui/utils/detectBrowser',
  );

  return {
    ...actual,
    isIOS: true,
  };
});

describe('<Combobox.Status /> iOS', () => {
  const { render, clock } = createRenderer();

  clock.withFakeTimers();

  it('skips the initial text mutation', async () => {
    await render(
      <Combobox.Root defaultOpen>
        <Combobox.Input />
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup>
              <Combobox.Status data-testid="status">Searching…</Combobox.Status>
              <Combobox.List>
                <Combobox.Item value="a">a</Combobox.Item>
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>,
    );

    expect(screen.getByRole('status')).toBe(screen.getByTestId('status'));
    expect(screen.getByTestId('status').textContent).toBe('Searching…');

    clock.tick(INITIAL_LIVE_REGION_TEXT_MUTATION_RESET_DELAY);

    expect(screen.getByTestId('status').textContent).toBe('Searching…');
  });
});
