import { expect, describe, it, afterEach } from 'vitest';
import * as React from 'react';
import { fireEvent, screen, waitFor } from '@mui/internal-test-utils';
import { Toggle, ToggleIndicator } from '@base-ui/react/toggle';
import { ToggleGroup } from '@base-ui/react/toggle-group';
import { createRenderer, describeConformance, isJSDOM } from '#test-utils';

describe('<ToggleIndicator />', () => {
  const { render } = createRenderer();

  describeConformance(<ToggleIndicator keepMounted />, () => ({
    refInstanceof: window.HTMLSpanElement,
    render(node) {
      return render(<Toggle>{node}</Toggle>);
    },
  }));

  it('is hidden from assistive technology', async () => {
    await render(
      <Toggle defaultPressed>
        <ToggleIndicator data-testid="indicator" />
      </Toggle>,
    );

    expect(screen.getByTestId('indicator')).toHaveAttribute('aria-hidden', 'true');
  });

  it('reflects the pressed state through data-pressed', async () => {
    const { user } = await render(
      <Toggle>
        <ToggleIndicator data-testid="indicator" keepMounted />
      </Toggle>,
    );

    const indicator = screen.getByTestId('indicator');
    expect(indicator).not.toHaveAttribute('data-pressed');

    await user.click(screen.getByRole('button'));
    expect(indicator).toHaveAttribute('data-pressed');
  });

  it('reflects the disabled state through data-disabled', async () => {
    await render(
      <Toggle disabled>
        <ToggleIndicator data-testid="indicator" keepMounted />
      </Toggle>,
    );

    expect(screen.getByTestId('indicator')).toHaveAttribute('data-disabled');
  });

  it('reflects the pressed state inside a toggle group', async () => {
    const { user } = await render(
      <ToggleGroup>
        <Toggle value="bold">
          <ToggleIndicator data-testid="indicator" keepMounted />
        </Toggle>
      </ToggleGroup>,
    );

    const indicator = screen.getByTestId('indicator');
    expect(indicator).not.toHaveAttribute('data-pressed');

    await user.click(screen.getByRole('button'));
    expect(indicator).toHaveAttribute('data-pressed');
  });

  describe('prop: match', () => {
    it.each([
      { name: 'pressed (default)', match: undefined, initiallyRendered: false },
      { name: 'pressed', match: 'pressed' as const, initiallyRendered: false },
      { name: 'unpressed', match: 'unpressed' as const, initiallyRendered: true },
    ])('renders only while the toggle is $name', async ({ match, initiallyRendered }) => {
      const { user } = await render(
        <Toggle>
          <ToggleIndicator data-testid="indicator" match={match} />
        </Toggle>,
      );

      expect(screen.queryByTestId('indicator') !== null).toBe(initiallyRendered);

      await user.click(screen.getByRole('button'));
      expect(screen.queryByTestId('indicator') !== null).toBe(!initiallyRendered);

      await user.click(screen.getByRole('button'));
      expect(screen.queryByTestId('indicator') !== null).toBe(initiallyRendered);
    });

    it('swaps between a pair of indicators', async () => {
      const { user } = await render(
        <Toggle>
          <ToggleIndicator match="unpressed">off</ToggleIndicator>
          <ToggleIndicator match="pressed">on</ToggleIndicator>
        </Toggle>,
      );

      const button = screen.getByRole('button');
      expect(button.textContent).toBe('off');

      await user.click(button);
      expect(button.textContent).toBe('on');
    });
  });

  describe('prop: keepMounted', () => {
    it('keeps the element in the DOM while it does not apply', async () => {
      await render(
        <Toggle>
          <ToggleIndicator data-testid="indicator" keepMounted />
        </Toggle>,
      );

      expect(screen.getByTestId('indicator')).not.toHaveAttribute('data-pressed');
    });
  });

  describe.skipIf(isJSDOM)('animations', () => {
    afterEach(() => {
      globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
    });

    it('applies data-ending-style before unmount', async () => {
      globalThis.BASE_UI_ANIMATIONS_DISABLED = false;

      const style = `
        @keyframes test-anim {
          to {
            opacity: 0;
          }
        }

        .animation-test-indicator[data-ending-style] {
          animation: test-anim 1ms;
        }
      `;

      await render(
        <div>
          {/* eslint-disable-next-line react/no-danger */}
          <style dangerouslySetInnerHTML={{ __html: style }} />
          <Toggle defaultPressed>
            <ToggleIndicator className="animation-test-indicator" data-testid="indicator" />
          </Toggle>
        </div>,
      );

      expect(screen.getByTestId('indicator')).not.toHaveAttribute('data-ending-style');

      // `user.click` can yield a frame, which is long enough for the 1ms animation to finish.
      fireEvent.click(screen.getByRole('button'));

      expect(screen.getByTestId('indicator')).toHaveAttribute('data-ending-style');

      await waitFor(() => {
        expect(screen.queryByTestId('indicator')).toBe(null);
      });
    });
  });
});
