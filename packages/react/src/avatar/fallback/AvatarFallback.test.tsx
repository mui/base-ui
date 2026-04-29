import { expect } from 'vitest';
import * as React from 'react';
import { Avatar } from '@base-ui/react/avatar';
import { waitFor, screen, fireEvent } from '@mui/internal-test-utils';
import { describeConformance, createRenderer, isJSDOM } from '#test-utils';

describe('<Avatar.Fallback />', () => {
  const { render } = createRenderer();

  describeConformance(<Avatar.Fallback />, () => ({
    render: (node) => {
      return render(<Avatar.Root>{node}</Avatar.Root>);
    },
    refInstanceof: window.HTMLSpanElement,
  }));

  it.skipIf(!isJSDOM)('exposes [data-loaded] once the image has loaded', async () => {
    await render(
      <Avatar.Root>
        <Avatar.Image src="avatar.png" />
        <Avatar.Fallback data-testid="fallback" />
      </Avatar.Root>,
    );

    fireEvent.load(screen.getByRole('presentation', { hidden: true }));

    await waitFor(() => {
      expect(screen.getByTestId('fallback')).toHaveAttribute('data-loaded');
    });
    expect(screen.getByTestId('fallback')).not.toHaveAttribute('data-loading');
    expect(screen.getByTestId('fallback')).not.toHaveAttribute('data-error');
  });

  it.skipIf(!isJSDOM)(
    'flips fallback to [data-loaded] after img load even when Fallback resolves later in tree order',
    async () => {
      await render(
        <Avatar.Root>
          <Avatar.Image src="avatar.png" />
          <Avatar.Fallback data-testid="fallback">AC</Avatar.Fallback>
        </Avatar.Root>,
      );

      // Initial render: no `Avatar.Image` has reported `'loaded'` yet, so Fallback signals loading.
      expect(screen.getByTestId('fallback')).toHaveAttribute('data-loading');

      fireEvent.load(screen.getByRole('presentation', { hidden: true }));

      await waitFor(() => {
        expect(screen.getByTestId('fallback')).toHaveAttribute('data-loaded');
      });
    },
  );

  it.skipIf(!isJSDOM)('exposes [data-error] when the image fails to load', async () => {
    await render(
      <Avatar.Root>
        <Avatar.Image src="/missing.png" data-testid="img" />
        <Avatar.Fallback data-testid="fallback">AC</Avatar.Fallback>
      </Avatar.Root>,
    );

    fireEvent.error(screen.getByTestId('img'));

    await waitFor(() => {
      expect(screen.getByTestId('fallback')).toHaveAttribute('data-error');
    });
    expect(screen.getByTestId('fallback')).toHaveTextContent('AC');
  });

  describe.skipIf(!isJSDOM)('prop: delay', () => {
    const { clock, render: renderFakeTimers } = createRenderer();

    clock.withFakeTimers();

    it('keeps the fallback in [data-loaded] until the delay has elapsed', async () => {
      await renderFakeTimers(
        <Avatar.Root>
          <Avatar.Image />
          <Avatar.Fallback delay={100} data-testid="fallback">
            AC
          </Avatar.Fallback>
        </Avatar.Root>,
      );

      // The fallback element is mounted from the start (so consumers can run CSS transitions),
      // but it carries `[data-loaded]` while the delay window is pending so consumer styles
      // keep it hidden.
      expect(screen.getByTestId('fallback')).toHaveAttribute('data-loaded');

      clock.tick(100);

      // After the delay elapses Fallback adopts the underlying image status — no `src` was
      // provided so the image is in `'error'`, which propagates here.
      expect(screen.getByTestId('fallback')).toHaveAttribute('data-error');
      expect(screen.getByTestId('fallback')).not.toHaveAttribute('data-loaded');
    });
  });

  it.skipIf(!isJSDOM)(
    'shows fallback while image loads then hides fallback after img load',
    async () => {
      function Test() {
        const [showImage, setShowImage] = React.useState(false);

        function handleShowImage() {
          setShowImage(true);
        }

        return (
          <div>
            <button onClick={handleShowImage}>Show image</button>
            <Avatar.Root>
              <Avatar.Image data-testid="image" src={showImage ? 'avatar.png' : undefined} />
              <Avatar.Fallback data-testid="fallback">AC</Avatar.Fallback>
            </Avatar.Root>
          </div>
        );
      }

      const { user } = await render(<Test />);

      // The `<img>` and the `<span>` fallback are both always rendered. While there's no `src`,
      // both carry `[data-error]`: consumers hide the `<img>` (broken-image glyph) and show the
      // fallback via that hook.
      expect(screen.getByTestId('image')).toHaveAttribute('data-error');
      expect(screen.getByTestId('fallback')).toHaveAttribute('data-error');

      await user.click(screen.getByText('Show image'));

      fireEvent.load(screen.getByTestId('image'));

      await waitFor(() => {
        expect(screen.getByTestId('fallback')).toHaveAttribute('data-loaded');
      });

      expect(screen.getByTestId('image')).toHaveAttribute('data-loaded');
    },
  );

  describe.skipIf(isJSDOM)('regression', () => {
    // 1x1 transparent PNG — loads in real browsers so the rendered <img> stays mounted
    // (unlike a missing path, which would 404 and unmount before the assertion runs).
    const DATA_URI =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

    // 1x1 transparent GIF — distinct cacheable src for the "switch between cached images" test.
    const DATA_URI_GIF =
      'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

    afterEach(() => {
      globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
    });

    it('flips fallback data attributes in lockstep with image state across src changes', async () => {
      function Test() {
        const [showImage, setShowImage] = React.useState(false);

        function handleShowImage() {
          setShowImage(true);
        }

        return (
          <div>
            <button onClick={handleShowImage}>Show image</button>
            <Avatar.Root>
              <Avatar.Image data-testid="image" src={showImage ? DATA_URI : undefined} />
              <Avatar.Fallback data-testid="fallback">AC</Avatar.Fallback>
            </Avatar.Root>
          </div>
        );
      }

      const { user } = await render(<Test />);

      // Both primitives are always mounted; data attributes describe the current state.
      expect(screen.getByTestId('image')).toHaveAttribute('data-error');
      expect(screen.getByTestId('fallback')).toHaveAttribute('data-error');

      await user.click(screen.getByText('Show image'));

      await waitFor(() => {
        expect(screen.getByTestId('fallback')).toHaveAttribute('data-loaded');
      });
      expect(screen.getByTestId('image')).toHaveAttribute('data-loaded');
      expect(screen.getByTestId('fallback')).not.toHaveAttribute('data-error');
    });

    // Regression: src → src swaps used to force `imageLoadingStatus` back through `'loading'`,
    // which made `Avatar.Fallback` advertise `[data-loading]` on top of the old bitmap that the
    // browser was still painting on the `<img>` while the new src decoded. Status now stays
    // `'loaded'` through the swap (relying on the browser's stale-image behaviour), so the
    // fallback's `[data-loaded]` hook never flips off and consumer CSS keeps it hidden.
    it('does not flash the fallback when switching between two browser-cached images', async () => {
      await Promise.all(
        [DATA_URI, DATA_URI_GIF].map(
          (src) =>
            new Promise<void>((resolve, reject) => {
              const img = new window.Image();
              img.onload = () => resolve();
              img.onerror = () => reject(new Error(`Failed to preload ${src}`));
              img.src = src;
            }),
        ),
      );

      function Test() {
        const [which, setWhich] = React.useState<'a' | 'b'>('a');

        return (
          <div>
            <button onClick={() => setWhich((prev) => (prev === 'a' ? 'b' : 'a'))}>
              Switch
            </button>
            <Avatar.Root>
              <Avatar.Image
                data-testid="image"
                src={which === 'a' ? DATA_URI : DATA_URI_GIF}
              />
              <Avatar.Fallback data-testid="fallback">AC</Avatar.Fallback>
            </Avatar.Root>
          </div>
        );
      }

      const { user } = await render(<Test />);

      await waitFor(() => {
        expect(screen.getByTestId('fallback')).toHaveAttribute('data-loaded');
        expect(screen.getByTestId('image')).toBeVisible();
      });

      await user.click(screen.getByText('Switch'));

      await waitFor(() => {
        expect(screen.getByTestId('image')).toHaveAttribute('src', DATA_URI_GIF);
      });

      // Fallback should never advertise itself as visible during a smooth src swap.
      expect(screen.getByTestId('fallback')).toHaveAttribute('data-loaded');
      expect(screen.getByTestId('fallback')).not.toHaveAttribute('data-loading');
    });
  });
});
