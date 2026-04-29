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

// 1x1 transparent GIF — distinct cacheable src for src → src swap tests.
const DATA_URI_GIF =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

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

    it('triggers enter animation when image flips from loading to loaded', async () => {
      globalThis.BASE_UI_ANIMATIONS_DISABLED = false;

      let transitionFinished = false;
      function notifyTransitionFinished() {
        transitionFinished = true;
      }

      const style = `
        .animation-test-image {
          transition: opacity 1ms;
        }

        .animation-test-image[data-loading],
        .animation-test-image[data-error] {
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

      // The `<img>` is always rendered. It carries `[data-error]` while there's no `src` so that
      // `loading="lazy"` and other intrinsic `<img>` features can take effect, and consumers can
      // hide it via CSS targeting that attribute.
      expect(screen.getByTestId('image')).toHaveAttribute('data-error');
      expect(screen.getByTestId('image')).not.toHaveAttribute('data-loaded');

      await user.click(screen.getByText('Show image'));

      await waitFor(() => {
        expect(transitionFinished).toBe(true);
      });

      expect(screen.getByTestId('image')).toHaveAttribute('data-loaded');
      expect(screen.getByTestId('image')).not.toHaveAttribute('data-error');
    });

    it('flips to [data-error] synchronously when src is removed (no broken-image flash)', async () => {
      // Regression coverage: when `src` is removed the browser drops the bitmap immediately, so a
      // previously-decoded `<img>` would briefly paint the broken-image glyph if it stayed
      // visible. The `<img>` stays mounted across the lifecycle but the lifecycle attribute flips
      // synchronously the moment the status leaves `'loaded'`, giving consumers a stable hook to
      // hide the element (e.g. `[data-error] { visibility: hidden }`) without flashes.
      function Test() {
        const [showImage, setShowImage] = React.useState(true);

        return (
          <div>
            <button onClick={() => setShowImage(false)}>Hide image</button>
            <Avatar.Root>
              <Avatar.Image
                data-testid="image"
                src={showImage ? DATA_URI : undefined}
              />
            </Avatar.Root>
          </div>
        );
      }

      const { user } = await render(<Test />);

      await waitFor(() => {
        expect(screen.getByTestId('image')).toHaveAttribute('data-loaded');
      });

      await user.click(screen.getByText('Hide image'));

      const image = screen.getByTestId('image');
      expect(image).not.toBe(null);
      expect(image).toHaveAttribute('data-error');
      expect(image).not.toHaveAttribute('data-loaded');
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

      // Server render: the always-mounted `<img>` and `<span>` fallback are both in the HTML.
      // The image carries `[data-loading]` (the cache fast-path can't run yet — layout effects
      // don't fire on the server), and the fallback mirrors that with `[data-loading]` so
      // consumer CSS keys both the broken-image-glyph hide and the fallback show off the same
      // attribute, leaving only the fallback content visually present.
      const { hydrate } = renderToString(
        <Avatar.Root>
          <Avatar.Image src={DATA_URI} alt="Jane Doe" />
          <Avatar.Fallback data-testid="fallback">JD</Avatar.Fallback>
        </Avatar.Root>,
      );

      expect(screen.getByText('JD')).toBeVisible();
      expect(screen.getByRole('img')).toHaveAttribute('data-loading');
      expect(screen.getByTestId('fallback')).toHaveAttribute('data-loading');

      // After hydration, the layout effect fires synchronously before paint.
      // For cached images, image.complete is true so status resolves to 'loaded'
      // immediately — no fallback flash.
      //
      // Assert synchronously (no waitFor) to verify the image is available on
      // the first post-hydration render, not after a delayed onload callback.
      hydrate();

      expect(screen.getByRole('img')).toHaveAttribute('data-loaded');
      expect(screen.getByRole('img')).toHaveAttribute('src', DATA_URI);
      // The fallback element stays mounted but flips to `[data-loaded]` so consumer CSS hides
      // it without a remount. The text node is still in the DOM (consumers may animate it out).
      expect(screen.getByTestId('fallback')).toHaveAttribute('data-loaded');
      expect(screen.getByTestId('fallback')).not.toHaveAttribute('data-loading');
    });

    it('flips to "error" after hydration when the bitmap failed to decode before React attached handlers', async () => {
      // Regression: when SSR'd HTML contains an `<img src=...>` whose URL fails (404, non-image
      // content, blocked) the browser starts the fetch immediately and may dispatch the `error`
      // event *before* React hydrates and attaches `onError`. Without compensating in the layout
      // effect we'd stay stuck on `'loading'` indefinitely on hard refresh — this test pins the
      // post-hydration `'error'` state so the regression can't return.
      restoreImage();

      // Pre-fail the URL synchronously so by the time we render-to-string + hydrate, the browser
      // already has `complete: true, naturalWidth: 0` cached for it. Same shape as a real
      // pre-hydration error: the `<img>` arrives at React with the failure already settled.
      const BROKEN_URI = 'data:image/png;base64,not-a-valid-image';
      await new Promise<void>((resolve) => {
        const img = new window.Image();
        img.onerror = () => resolve();
        img.onload = () => resolve();
        img.src = BROKEN_URI;
      });

      const { hydrate } = renderToString(
        <Avatar.Root>
          <Avatar.Image src={BROKEN_URI} alt="Jane Doe" />
          <Avatar.Fallback data-testid="fallback">JD</Avatar.Fallback>
        </Avatar.Root>,
      );

      expect(screen.getByRole('img')).toHaveAttribute('data-loading');
      expect(screen.getByTestId('fallback')).toHaveAttribute('data-loading');

      hydrate();

      // Browsers can settle decode failures synchronously *or* on a microtask depending on the
      // pipeline (cached failures vs. fresh data-URI evaluations vs. real network 404s). Either
      // path lands at the same observable state: the layout-effect's `complete + !naturalWidth`
      // branch handles the synchronous case directly, and the post-hydration `onError` handles
      // the microtask case once it fires. We wait so the test covers both, since the playground
      // bug surfaces specifically when neither path resolves.
      await waitFor(() => {
        expect(screen.getByRole('img')).toHaveAttribute('data-error');
      });
      expect(screen.getByRole('img')).not.toHaveAttribute('data-loading');
      expect(screen.getByTestId('fallback')).toHaveAttribute('data-error');
      expect(screen.getByTestId('fallback')).not.toHaveAttribute('data-loading');
    });

    it('reaches the [data-loaded] steady state without firing an entry transition for a cached image', async () => {
      // Restore real Image so this test exercises actual browser caching
      restoreImage();

      // Pre-load so `img.complete` is true synchronously when AvatarImage mounts —
      // exercises the cache fast-path that resolves the bitmap before the first paint.
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
        .cached-no-anim[data-loading],
        .cached-no-anim[data-error] {
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

      // Give any in-flight transition more than enough time to land.
      await act(async () => {
        await new Promise<void>((resolve) => {
          setTimeout(resolve, 50);
        });
      });

      const image = screen.getByTestId('image');
      expect(image).toHaveAttribute('data-loaded');
      expect(image).not.toHaveAttribute('data-loading');
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

    it('does not fire stale status on src change from undefined to a cached image', async () => {
      restoreImage();

      await new Promise<void>((resolve, reject) => {
        const img = new window.Image();
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to preload test image'));
        img.src = DATA_URI;
      });

      const calls: ImageLoadingStatus[] = [];
      const onLoadingStatusChange = (status: ImageLoadingStatus) => calls.push(status);

      const { setPropsAsync } = await render(
        <Avatar.Root>
          <Avatar.Image
            data-testid="image"
            onLoadingStatusChange={onLoadingStatusChange}
          />
        </Avatar.Root>,
      );

      await act(async () => {
        await new Promise<void>((resolve) => {
          setTimeout(resolve, 50);
        });
      });

      await setPropsAsync({
        children: (
          <Avatar.Image
            data-testid="image"
            onLoadingStatusChange={onLoadingStatusChange}
            src={DATA_URI}
          />
        ),
      });

      await waitFor(() => {
        expect(screen.getByTestId('image')).toBeVisible();
      });

      await act(async () => {
        await new Promise<void>((resolve) => {
          setTimeout(resolve, 50);
        });
      });

      // Initial commit fires `'error'` (no src), then the src change resolves cached so the
      // cache fast-path suppresses the transient `'loading'` and the consumer sees `'loaded'`
      // once. A failure mode would be either a stale `'loaded'` slipping out before the real
      // `'loaded'`, or `'error'` firing twice on the StrictMode double-mount.
      expect(calls).toEqual(['error', 'loaded']);
    });

    it('keeps status at "loaded" through a src → src swap', async () => {
      restoreImage();

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

      const calls: ImageLoadingStatus[] = [];
      const onLoadingStatusChange = (status: ImageLoadingStatus) => calls.push(status);

      const { setPropsAsync } = await render(
        <Avatar.Root>
          <Avatar.Image
            data-testid="image"
            onLoadingStatusChange={onLoadingStatusChange}
            src={DATA_URI}
          />
        </Avatar.Root>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('image')).toBeVisible();
      });

      expect(calls).toEqual(['loaded']);

      await setPropsAsync({
        children: (
          <Avatar.Image
            data-testid="image"
            onLoadingStatusChange={onLoadingStatusChange}
            src={DATA_URI_GIF}
          />
        ),
      });

      await waitFor(() => {
        expect(screen.getByTestId('image')).toHaveAttribute('src', DATA_URI_GIF);
      });

      await act(async () => {
        await new Promise<void>((resolve) => {
          setTimeout(resolve, 50);
        });
      });

      // Browsers keep painting the previously-decoded bitmap on `<img>` while a new src
      // decodes, so a swap between two valid images is a smooth visual transition. Forcing
      // status back through `'loading'` would pop the fallback on top of that still-visible
      // bitmap for a frame — instead status stays at `'loaded'` and the consumer sees no
      // additional fire.
      expect(calls).toEqual(['loaded']);
    });

    it('flips to "error" on a src → broken-src swap', async () => {
      restoreImage();

      await new Promise<void>((resolve, reject) => {
        const img = new window.Image();
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to preload test image'));
        img.src = DATA_URI;
      });

      const calls: ImageLoadingStatus[] = [];
      const onLoadingStatusChange = (status: ImageLoadingStatus) => calls.push(status);

      const { setPropsAsync } = await render(
        <Avatar.Root>
          <Avatar.Image
            data-testid="image"
            onLoadingStatusChange={onLoadingStatusChange}
            src={DATA_URI}
          />
        </Avatar.Root>,
      );

      await waitFor(() => {
        expect(calls).toEqual(['loaded']);
      });

      // Use an invalid data URI so `onError` fires deterministically without a network round trip.
      await setPropsAsync({
        children: (
          <Avatar.Image
            data-testid="image"
            onLoadingStatusChange={onLoadingStatusChange}
            src="data:image/png;base64,not-a-valid-image"
          />
        ),
      });

      await waitFor(() => {
        expect(calls).toEqual(['loaded', 'error']);
      });
    });

    it('does not double-fire the same status when effects re-run (e.g. StrictMode)', async () => {
      // StrictMode double-invokes layout effects on mount in dev, which would otherwise cause
      // the initial `'loading'` / `'error'` fire to be observed by the consumer twice. The
      // dedupe guard inside the status-change effect short-circuits the second invocation.
      const calls: ImageLoadingStatus[] = [];

      await render(
        <Avatar.Root>
          <Avatar.Image
            data-testid="image"
            onLoadingStatusChange={(status) => calls.push(status)}
          />
        </Avatar.Root>,
      );

      await act(async () => {
        await new Promise<void>((resolve) => {
          setTimeout(resolve, 50);
        });
      });

      expect(calls).toEqual(['error']);
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
        <Avatar.Fallback data-testid="fallback">JD</Avatar.Fallback>
      </Avatar.Root>,
    );

    expect(screen.getByRole('img')).toHaveAttribute(
      'src',
      'https://example.com/cached-avatar.png',
    );

    fireEvent.load(screen.getByRole('img'));

    await waitFor(() => {
      expect(screen.getByTestId('fallback')).toHaveAttribute('data-loaded');
    });
  });

  // Regression coverage for https://github.com/mui/base-ui/issues/2597. Master fetched the
  // image via `new window.Image()` — an off-DOM element — so `loading="lazy"` (and other
  // intrinsic `<img>` attributes) had nowhere to apply. The refactor renders an actual
  // `<img>` and forwards intrinsic attributes through, which is what makes lazy loading
  // (and `srcset` / `decoding` / `fetchpriority`) reachable for consumers in the first place.
  describe('intrinsic <img> attributes', () => {
    it('renders an actual <img> element while loading', async () => {
      await render(
        <Avatar.Root>
          <Avatar.Image data-testid="image" src="https://example.com/uncached.png" />
        </Avatar.Root>,
      );

      const img = screen.getByTestId('image');
      expect(img).toBeInstanceOf(window.HTMLImageElement);
      expect(img).toHaveAttribute('src', 'https://example.com/uncached.png');
    });

    it('forwards loading="lazy" to the rendered <img>', async () => {
      await render(
        <Avatar.Root>
          <Avatar.Image data-testid="image" src={DATA_URI} loading="lazy" />
        </Avatar.Root>,
      );

      expect(screen.getByTestId('image')).toHaveAttribute('loading', 'lazy');
    });

    it('forwards loading="eager" to the rendered <img>', async () => {
      await render(
        <Avatar.Root>
          <Avatar.Image data-testid="image" src={DATA_URI} loading="eager" />
        </Avatar.Root>,
      );

      expect(screen.getByTestId('image')).toHaveAttribute('loading', 'eager');
    });

    it('forwards decoding, fetchPriority, srcSet and sizes to the rendered <img>', async () => {
      await render(
        <Avatar.Root>
          <Avatar.Image
            data-testid="image"
            src={DATA_URI}
            decoding="async"
            fetchPriority="high"
            srcSet={`${DATA_URI} 1x, ${DATA_URI} 2x`}
            sizes="(max-width: 600px) 32px, 64px"
          />
        </Avatar.Root>,
      );

      const img = screen.getByTestId('image');
      expect(img).toHaveAttribute('decoding', 'async');
      expect(img).toHaveAttribute('fetchpriority', 'high');
      expect(img).toHaveAttribute('srcset', `${DATA_URI} 1x, ${DATA_URI} 2x`);
      expect(img).toHaveAttribute('sizes', '(max-width: 600px) 32px, 64px');
    });
  });
});
