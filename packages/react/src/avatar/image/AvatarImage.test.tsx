import { expect } from 'vitest';
import * as React from 'react';
import { Avatar } from '@base-ui/react/avatar';
import { screen, fireEvent, waitFor } from '@mui/internal-test-utils';
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
                src={showImage ? 'avatar.png' : undefined}
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
                src={showImage ? 'avatar.png' : undefined}
              />
            </Avatar.Root>
          </div>
        );
      }

      const { user } = await render(<Test />);
      expect(screen.getByTestId('image')).not.toBe(null);

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
    // 1x1 transparent PNG
    const DATA_URI =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

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
  });

  it('hides fallback until intrinsic onError reconciles decode failure', async () => {
    await render(
      <Avatar.Root>
        <Avatar.Image alt="" data-testid="assume-img" src="/missing-hash.png" />
        <Avatar.Fallback>X</Avatar.Fallback>
      </Avatar.Root>,
    );

    expect(screen.queryByText('X')).toBe(null);

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
    expect(screen.queryByText('JD')).toBe(null);
  });
});
