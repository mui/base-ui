import { expect } from 'vitest';
import * as React from 'react';
import { Avatar, type ImageLoadingStatus } from '@base-ui/react/avatar';
import { act, screen, fireEvent, waitFor } from '@mui/internal-test-utils';
import { describeConformance, createRenderer, isJSDOM } from '#test-utils';

/**
 * Replaces `window.Image` with a constructor that simulates a browser's
 * cached-image behavior: setting `.src` immediately makes `.complete = true`
 * and `.naturalWidth > 0`, but the async `onload` callback has not yet fired
 * (it would be queued as a task in a real browser).
 *
 * This is the exact state the fix targets — without the `image.complete`/`decode` path, the img can stay concealed
 * until `load` fires while the hook already reports `'loaded'`.
 */
function mockCachedImageLoading({ naturalWidth = 100 } = {}) {
  const OriginalImage = window.Image;

  window.Image = function MockImage() {
    let srcValue = '';
    const obj = {
      complete: false,
      naturalWidth: 0,
      onload: null as (() => void) | null,
      onerror: null as (() => void) | null,
      referrerPolicy: '',
      crossOrigin: null as string | null,
      get src() {
        return srcValue;
      },
      set src(value: string) {
        srcValue = value;
        obj.complete = true;
        obj.naturalWidth = naturalWidth;
      },
    };
    return obj;
  } as unknown as typeof window.Image;

  return () => {
    window.Image = OriginalImage;
  };
}

// 1x1 transparent PNG — usable as an `<img src>` that actually loads in real browsers.
const DATA_URI =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

describe('<Avatar.Image />', () => {
  const { render, renderToString } = createRenderer();

  let restoreImage: () => void;

  beforeEach(() => {
    restoreImage = mockCachedImageLoading();
  });

  afterEach(() => {
    restoreImage();
  });

  describeConformance(<Avatar.Image src="test.png" />, () => ({
    render: (node) => {
      return render(<Avatar.Root>{node}</Avatar.Root>);
    },
    refInstanceof: window.HTMLImageElement,
  }));

  describe.skipIf(isJSDOM)('animations', () => {
    afterEach(() => {
      globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
    });

    it('triggers enter animation via data-starting-style when mounting', async () => {
      globalThis.BASE_UI_ANIMATIONS_DISABLED = false;

      let transitionFinished = false;
      function notifyTransitionFinished() {
        transitionFinished = true;
      }

      const style = `
        .animation-test-image {
          transition: opacity 1ms;
        }

        .animation-test-image[data-starting-style],
        .animation-test-image[data-ending-style] {
          opacity: 0;
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
              <Avatar.Image
                className="animation-test-image"
                data-testid="image"
                onTransitionEnd={notifyTransitionFinished}
                src={showImage ? DATA_URI : undefined}
              />
            </Avatar.Root>
          </div>
        );
      }

      const { user } = await render(<Test />);
      expect(screen.queryByTestId('image')).toBe(null);

      await user.click(screen.getByText('Show image'));

      await waitFor(() => {
        expect(transitionFinished).toBe(true);
      });

      expect(screen.getByTestId('image')).not.toBe(null);
    });

    it('applies data-ending-style before unmount', async () => {
      globalThis.BASE_UI_ANIMATIONS_DISABLED = false;

      const style = `
        @keyframes test-anim {
          to {
            opacity: 0;
          }
        }

        .animation-test-image[data-ending-style] {
          animation: test-anim 1ms;
        }
      `;

      function Test() {
        const [showImage, setShowImage] = React.useState(true);

        function handleHideImage() {
          setShowImage(false);
        }

        return (
          <div>
            {/* eslint-disable-next-line react/no-danger */}
            <style dangerouslySetInnerHTML={{ __html: style }} />
            <button onClick={handleHideImage}>Hide image</button>
            <Avatar.Root>
              <Avatar.Image
                className="animation-test-image"
                data-testid="image"
                src={showImage ? DATA_URI : undefined}
              />
            </Avatar.Root>
          </div>
        );
      }

      const { user } = await render(<Test />);

      // Wait for the data URI to actually load so the img is mounted (not still hidden in `loading`).
      await waitFor(() => {
        expect(screen.getByTestId('image')).not.toHaveAttribute('hidden');
      });

      await user.click(screen.getByText('Hide image'));

      await waitFor(() => {
        const image = screen.queryByTestId('image');
        expect(image).not.toBe(null);
        expect(image).toHaveAttribute('data-ending-style');
      });

      await waitFor(() => {
        expect(screen.queryByTestId('image')).toBe(null);
      });
    });
  });

  describe.skipIf(isJSDOM)('cached images', () => {
    it('does not flash fallback for a cached image during SSR hydration', async () => {
      // Restore real Image so this test exercises actual browser caching
      restoreImage();

      // Pre-load so the browser cache has the decoded image
      await new Promise<void>((resolve, reject) => {
        const img = new window.Image();
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to preload test image'));
        img.src = DATA_URI;
      });

      // Server render: layout effects don't run, so fallback is in the HTML
      const { hydrate } = renderToString(
        <Avatar.Root>
          <Avatar.Image src={DATA_URI} alt="Jane Doe" />
          <Avatar.Fallback>JD</Avatar.Fallback>
        </Avatar.Root>,
      );

      expect(screen.getByText('JD')).toBeVisible();
      expect(screen.queryByRole('img')).toBe(null);

      // After hydration, the layout effect fires synchronously before paint.
      // For cached images, image.complete is true so status resolves to 'loaded'
      // immediately — no fallback flash.
      //
      // Assert synchronously (no waitFor) to verify the image is available on
      // the first post-hydration render, not after a delayed onload callback.
      hydrate();

      expect(screen.getByRole('img')).toHaveAttribute('src', DATA_URI);
      expect(screen.queryByText('JD')).toBe(null);
    });

    it('does not apply [data-starting-style] for a cached image', async () => {
      // Restore real Image so this test exercises actual browser caching
      restoreImage();

      // Pre-load so `img.complete` is true synchronously when AvatarImage mounts —
      // exercises the cache fast-path that should suppress the entry transition.
      await new Promise<void>((resolve, reject) => {
        const img = new window.Image();
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to preload test image'));
        img.src = DATA_URI;
      });

      let transitionFired = false;
      function notifyTransitionFired() {
        transitionFired = true;
      }

      const style = `
        .cached-no-anim {
          transition: opacity 1ms;
        }
        .cached-no-anim[data-starting-style],
        .cached-no-anim[data-ending-style] {
          opacity: 0;
        }
      `;

      await render(
        <div>
          {/* eslint-disable-next-line react/no-danger */}
          <style dangerouslySetInnerHTML={{ __html: style }} />
          <Avatar.Root>
            <Avatar.Image
              className="cached-no-anim"
              data-testid="image"
              onTransitionEnd={notifyTransitionFired}
              src={DATA_URI}
            />
          </Avatar.Root>
        </div>,
      );

      // Give any in-flight transition more than enough time to land — wrap in `act` so
      // `useTransitionStatus`'s internal rAF flip ('starting' → undefined) is processed inside
      // a React-wrapped scope and doesn't trip the no-act-warning console assertion.
      await act(async () => {
        await new Promise<void>((resolve) => {
          setTimeout(resolve, 50);
        });
      });

      expect(screen.getByTestId('image')).not.toHaveAttribute('data-starting-style');
      expect(transitionFired).toBe(false);
    });

    it('fires onLoadingStatusChange exactly once with "loaded" for a cached image', async () => {
      restoreImage();

      // Pre-load so the cache fast-path will resolve synchronously on first commit.
      await new Promise<void>((resolve, reject) => {
        const img = new window.Image();
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to preload test image'));
        img.src = DATA_URI;
      });

      const calls: ImageLoadingStatus[] = [];

      await render(
        <Avatar.Root>
          <Avatar.Image
            data-testid="image"
            onLoadingStatusChange={(status) => calls.push(status)}
            src={DATA_URI}
          />
        </Avatar.Root>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('image')).toBeVisible();
      });

      // Allow any pending `'loading'` to fire if the suppression were broken.
      await act(async () => {
        await new Promise<void>((resolve) => {
          setTimeout(resolve, 50);
        });
      });

      expect(calls).toEqual(['loaded']);
    });
  });

  it('shows fallback while loading then stays visible after intrinsic error', async () => {
    await render(
      <Avatar.Root>
        <Avatar.Image alt="" data-testid="assume-img" src="/missing-hash.png" />
        <Avatar.Fallback>X</Avatar.Fallback>
      </Avatar.Root>,
    );

    expect(screen.getByText('X')).toBeVisible();

    fireEvent.error(screen.getByTestId('assume-img'));

    await waitFor(() => {
      expect(screen.getByText('X')).toBeVisible();
    });
  });

  it.skipIf(!isJSDOM)('shows the image immediately for a cached src', async () => {
    await render(
      <Avatar.Root>
        <Avatar.Image src="https://example.com/cached-avatar.png" alt="Jane Doe" />
        <Avatar.Fallback>JD</Avatar.Fallback>
      </Avatar.Root>,
    );

    expect(screen.getByRole('img', { hidden: true })).toHaveAttribute(
      'src',
      'https://example.com/cached-avatar.png',
    );

    fireEvent.load(screen.getByRole('img', { hidden: true }));

    await waitFor(() => {
      expect(screen.queryByText('JD')).toBe(null);
    });
  });
});
