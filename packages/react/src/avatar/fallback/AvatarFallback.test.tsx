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

  it.skipIf(!isJSDOM)('should not render the children if the image loaded', async () => {
    await render(
      <Avatar.Root>
        <Avatar.Image src="avatar.png" />
        <Avatar.Fallback data-testid="fallback" />
      </Avatar.Root>,
    );

    fireEvent.load(screen.getByRole('presentation', { hidden: true }));

    await waitFor(() => {
      expect(screen.queryByTestId('fallback')).toBe(null);
    });
  });

  it.skipIf(!isJSDOM)(
    'hides fallback after img load even when Fallback resolves later in tree order',
    async () => {
      await render(
        <Avatar.Root>
          <Avatar.Image src="avatar.png" />
          <Avatar.Fallback data-testid="fallback">AC</Avatar.Fallback>
        </Avatar.Root>,
      );

      expect(screen.queryByTestId('fallback')).not.toBe(null);

      fireEvent.load(screen.getByRole('presentation', { hidden: true }));

      await waitFor(() => {
        expect(screen.queryByTestId('fallback')).toBe(null);
      });
    },
  );

  it.skipIf(!isJSDOM)('should render the fallback if the image fails to load', async () => {
    await render(
      <Avatar.Root>
        <Avatar.Image src="/missing.png" data-testid="img" />
        <Avatar.Fallback>AC</Avatar.Fallback>
      </Avatar.Root>,
    );

    fireEvent.error(screen.getByTestId('img'));

    await waitFor(() => {
      expect(screen.queryByText('AC')).not.toBe(null);
    });
  });

  describe.skipIf(!isJSDOM)('prop: delay', () => {
    const { clock, render: renderFakeTimers } = createRenderer();

    clock.withFakeTimers();

    it('shows the fallback when the delay has elapsed', async () => {
      await renderFakeTimers(
        <Avatar.Root>
          <Avatar.Image />
          <Avatar.Fallback delay={100}>AC</Avatar.Fallback>
        </Avatar.Root>,
      );

      expect(screen.queryByText('AC')).toBe(null);

      clock.tick(100);

      expect(screen.queryByText('AC')).not.toBe(null);
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

      expect(screen.queryByTestId('image')).toBe(null);
      expect(screen.getByTestId('fallback')).not.toBe(null);

      await user.click(screen.getByText('Show image'));

      await waitFor(() => {
        expect(screen.queryByTestId('image')).not.toBe(null);
      });

      fireEvent.load(screen.getByTestId('image'));

      await waitFor(() => {
        expect(screen.queryByTestId('fallback')).toBe(null);
      });
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

    it('keeps only one of image or fallback mounted when switching to image', async () => {
      globalThis.BASE_UI_ANIMATIONS_DISABLED = false;

      const style = `
        @keyframes test-exit {
          to {
            opacity: 0;
          }
        }

        .animation-test-fallback[data-ending-style] {
          animation: test-exit 2s;
        }
      `;

      function Test() {
        const [showImage, setShowImage] = React.useState(false);

        function handleShowImage() {
          setShowImage(true);
        }

        return (
          <div>
            {/* eslint-disable-next-line react/no-danger */}
            <style dangerouslySetInnerHTML={{ __html: style }} />
            <button onClick={handleShowImage}>Show image</button>
            <Avatar.Root>
              <Avatar.Image data-testid="image" src={showImage ? DATA_URI : undefined} />
              <Avatar.Fallback className="animation-test-fallback" data-testid="fallback">
                AC
              </Avatar.Fallback>
            </Avatar.Root>
          </div>
        );
      }

      const { user } = await render(<Test />);

      expect(screen.queryByTestId('image')).toBe(null);
      expect(screen.getByTestId('fallback')).not.toBe(null);

      await user.click(screen.getByText('Show image'));

      await waitFor(() => {
        expect(screen.queryByTestId('fallback')).toBe(null);
      });
    });

    // Regression: when `src` switches between two browser-cached images, the cache fast-path
    // settles the new bitmap to `'loaded'` synchronously inside a layout effect. If the lifted
    // status in `Avatar.Root` is gated behind the same dedupe/suppression as the public
    // `onLoadingStatusChange` callback, the lifted status never updates (last fired status was
    // `'loaded'` from the previous src, so the new `'loaded'` is short-circuited) — and
    // `Avatar.Fallback` keeps the stale `enabled=true` from the brief `'loading'` frame that
    // happened during the parent's re-render. The fallback then sits on top of the freshly
    // loaded image until something else forces a re-render.
    it('hides fallback after switching between two browser-cached images', async () => {
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
        expect(screen.queryByTestId('fallback')).toBe(null);
        expect(screen.getByTestId('image')).toBeVisible();
      });

      await user.click(screen.getByText('Switch'));

      await waitFor(() => {
        expect(screen.getByTestId('image')).toHaveAttribute('src', DATA_URI_GIF);
      });

      // The cache fast-path runs in a layout effect, so the fallback should be unmounted by
      // the time the new src is committed — not stuck visible until something forces another
      // render.
      expect(screen.queryByTestId('fallback')).toBe(null);
    });
  });
});
