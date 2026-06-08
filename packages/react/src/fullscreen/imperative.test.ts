import { expect, vi } from 'vitest';
import { Fullscreen } from '@base-ui/react/fullscreen';
import { installFullscreenApiStubs, type FullscreenApiStubs } from './root/fullscreenApiTestUtils';

describe('Fullscreen imperative API', () => {
  let stubs: FullscreenApiStubs;

  beforeEach(() => {
    stubs = installFullscreenApiStubs();
  });

  afterEach(() => {
    stubs.restore();
  });

  describe('Fullscreen.request', () => {
    it('calls Element.requestFullscreen on the given element', async () => {
      const element = document.createElement('div');
      document.body.appendChild(element);

      await Fullscreen.request(element);

      expect(stubs.request).toHaveBeenCalledOnce();
      expect(document.fullscreenElement).toBe(element);

      document.body.removeChild(element);
    });

    it('forwards navigationUI option to requestFullscreen', async () => {
      const element = document.createElement('div');
      document.body.appendChild(element);

      await Fullscreen.request(element, { navigationUI: 'hide' });

      expect(stubs.request).toHaveBeenCalledWith({ navigationUI: 'hide' });

      document.body.removeChild(element);
    });

    it('rejects when the Fullscreen API is not available on the element', async () => {
      // Synthesize an element-like object that exposes neither
      // `requestFullscreen` nor the prefixed `webkitRequestFullscreen` so the
      // wrapper's "API unavailable" branch fires. Avoiding mutation of real DOM
      // prototypes keeps this stable across both jsdom and Chromium.
      const fakeElement = {} as Element;
      await expect(Fullscreen.request(fakeElement)).rejects.toThrowError(/Fullscreen API/);
    });

    it('propagates rejections from the browser', async () => {
      const element = document.createElement('div');
      document.body.appendChild(element);
      stubs.request.mockImplementation(() => Promise.reject(new TypeError('blocked')));

      await expect(Fullscreen.request(element)).rejects.toThrow('blocked');

      document.body.removeChild(element);
    });
  });

  describe('Fullscreen.exit', () => {
    it('calls Document.exitFullscreen', async () => {
      const element = document.createElement('div');
      document.body.appendChild(element);
      await Fullscreen.request(element);
      expect(document.fullscreenElement).toBe(element);

      await Fullscreen.exit();

      expect(stubs.exit).toHaveBeenCalledOnce();
      expect(document.fullscreenElement).toBeNull();

      document.body.removeChild(element);
    });

    it('resolves to a no-op when no element is currently in fullscreen', async () => {
      expect(document.fullscreenElement).toBeNull();

      await Fullscreen.exit();

      expect(stubs.exit).not.toHaveBeenCalled();
    });

    it('exits fullscreen on a custom document when one is provided', async () => {
      const exitSpy = vi.fn().mockImplementation(() => Promise.resolve());
      const fakeDoc = {
        exitFullscreen: exitSpy,
        fullscreenElement: document.createElement('div'),
      } as unknown as Document;

      await Fullscreen.exit(fakeDoc);

      expect(exitSpy).toHaveBeenCalledOnce();
    });
  });
});
