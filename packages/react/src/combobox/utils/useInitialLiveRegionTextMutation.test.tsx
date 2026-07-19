import { expect } from 'vitest';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { createRenderer } from '#test-utils';
import { screen } from '@mui/internal-test-utils';
import {
  INITIAL_LIVE_REGION_TEXT_MUTATION_RESET_DELAY,
  useInitialLiveRegionTextMutation,
} from './useInitialLiveRegionTextMutation';

describe('useInitialLiveRegionTextMutation', () => {
  const { render } = createRenderer();
  const { render: renderWithFakeTimers, clock } = createRenderer({
    clockOptions: { shouldAdvanceTime: true },
  });

  clock.withFakeTimers();

  it('does nothing when its ref is not attached', async () => {
    function Unattached() {
      useInitialLiveRegionTextMutation();
      return null;
    }

    await render(<Unattached />);
  });

  it('skips empty text nodes when finding the announcement text', async () => {
    function Status() {
      const ref = useInitialLiveRegionTextMutation<HTMLDivElement>();

      useIsoLayoutEffect(() => {
        const empty = document.createTextNode('');
        const text = document.createTextNode('Status');
        ref.current?.append(empty, text);
      }, [ref]);

      return <div ref={ref} data-testid="status" />;
    }

    await render(<Status />);

    expect(screen.getByTestId('status').textContent).toContain('\u2060');
  });

  it('does not overwrite text that changes before the reset', async () => {
    function Status() {
      const ref = useInitialLiveRegionTextMutation<HTMLDivElement>();
      return (
        <div ref={ref} data-testid="status">
          Status
        </div>
      );
    }

    await renderWithFakeTimers(<Status />);
    const status = screen.getByTestId('status');
    status.firstChild!.nodeValue = 'Updated';

    clock.tick(INITIAL_LIVE_REGION_TEXT_MUTATION_RESET_DELAY);

    expect(status).toHaveTextContent('Updated');
  });
});
