import { expect, describe, it } from 'vitest';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { createRenderer } from '#test-utils';
import { screen } from '@mui/internal-test-utils';
import {
  INITIAL_LIVE_REGION_TEXT_MUTATION_RESET_DELAY,
  useInitialLiveRegionTextMutation,
} from './useInitialLiveRegionTextMutation';

describe('useInitialLiveRegionTextMutation', () => {
  const { render } = createRenderer();

  it('does nothing when its ref is not attached', async () => {
    function Unattached() {
      useInitialLiveRegionTextMutation();
      return <div data-testid="status">Status</div>;
    }

    await render(<Unattached />);

    expect(screen.getByTestId('status')).toHaveTextContent('Status');
  });

  it('marks the text when the element appears after mount', async () => {
    function Status(props: { present: boolean }) {
      const ref = useInitialLiveRegionTextMutation<HTMLDivElement>(props.present);
      if (!props.present) {
        return null;
      }
      return (
        <div ref={ref} data-testid="status">
          Ready
        </div>
      );
    }

    const { setProps } = await render(<Status present={false} />);

    expect(screen.queryByTestId('status')).toBe(null);

    await setProps({ present: true });

    expect(screen.getByTestId('status').firstChild).toHaveProperty('nodeValue', 'Ready\u2060');
  });

  it('skips empty text nodes when finding the announcement text', async () => {
    const text = document.createTextNode('Status');
    const empty = document.createTextNode('');

    function Status() {
      const ref = useInitialLiveRegionTextMutation<HTMLDivElement>();

      useIsoLayoutEffect(() => {
        ref.current?.append(text, empty);
      }, [ref]);

      return <div ref={ref} data-testid="status" />;
    }

    await render(<Status />);

    expect(text.data).toBe('Status\u2060');
    expect(empty.data).toBe('');
  });

  describe('with fake timers', () => {
    const { render: renderWithFakeTimers, clock } = createRenderer({
      clockOptions: { shouldAdvanceTime: true },
    });

    clock.withFakeTimers();

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
});
