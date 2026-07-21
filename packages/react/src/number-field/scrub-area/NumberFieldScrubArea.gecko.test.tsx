import { expect, vi } from 'vitest';
import { screen, act } from '@mui/internal-test-utils';
import { NumberField } from '@base-ui/react/number-field';
import { createRenderer, isJSDOM } from '#test-utils';
import { platform } from '@base-ui/utils/platform';

vi.mock('@base-ui/utils/platform', async () => {
  const actual =
    await vi.importActual<typeof import('@base-ui/utils/platform')>('@base-ui/utils/platform');

  return {
    ...actual,
    platform: {
      ...actual.platform,
      engine: { ...actual.platform.engine, gecko: true },
    },
  };
});

// Scrubbing relies on real pointer movement, which only the Chromium/Firefox runners provide.
describe.skipIf(isJSDOM || platform.engine.webkit)('<NumberField.ScrubArea /> on Gecko', () => {
  const { render, clock } = createRenderer();

  clock.withFakeTimers();

  it('delays releasing the pointer lock so soft clicks are not swallowed', async () => {
    const onValueCommitted = vi.fn();

    await render(
      <NumberField.Root defaultValue={0} data-testid="root" onValueCommitted={onValueCommitted}>
        <NumberField.Input />
        <NumberField.ScrubArea data-testid="scrub-area">
          <NumberField.ScrubAreaCursor />
        </NumberField.ScrubArea>
      </NumberField.Root>,
    );

    const scrubArea = screen.getByTestId('scrub-area');
    const root = screen.getByTestId('root');
    const box = scrubArea.getBoundingClientRect();

    await act(async () => {
      scrubArea.dispatchEvent(
        new PointerEvent('pointerdown', {
          bubbles: true,
          clientX: box.left + box.width / 2,
          clientY: box.top + box.height / 2,
        }),
      );
      scrubArea.dispatchEvent(
        new PointerEvent('pointermove', { bubbles: true, movementX: 10, movementY: 0 }),
      );
    });

    expect(screen.getByRole('textbox')).toHaveValue('10');

    await act(async () => {
      window.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
    });

    // Firefox needs the pointer lock to outlive the release, so the scrub is still open here.
    expect(onValueCommitted).not.toHaveBeenCalled();
    expect(root).toHaveAttribute('data-scrubbing');

    await act(async () => {
      clock.tick(20);
    });

    expect(onValueCommitted.mock.calls.length).toBe(1);
    expect(onValueCommitted.mock.lastCall?.[0]).toBe(10);
    expect(root).not.toHaveAttribute('data-scrubbing');
  });
});
