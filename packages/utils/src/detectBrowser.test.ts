import { expect, vi } from 'vitest';

const originalNavigatorDescriptors = new Map<string, PropertyDescriptor | undefined>();

function setNavigatorProperty(name: string, value: unknown) {
  if (!originalNavigatorDescriptors.has(name)) {
    originalNavigatorDescriptors.set(name, Object.getOwnPropertyDescriptor(navigator, name));
  }

  Object.defineProperty(navigator, name, {
    configurable: true,
    value,
  });
}

async function importDetectBrowser() {
  vi.resetModules();
  return import('./detectBrowser');
}

afterEach(() => {
  vi.resetModules();

  originalNavigatorDescriptors.forEach((descriptor, name) => {
    if (descriptor) {
      Object.defineProperty(navigator, name, descriptor);
    } else {
      delete (navigator as unknown as Record<string, unknown>)[name];
    }
  });
  originalNavigatorDescriptors.clear();
});

describe('detectBrowser', () => {
  it('does not parse User-Agent Client Hints brands as the user agent string', async () => {
    setNavigatorProperty(
      'userAgent',
      'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    );
    setNavigatorProperty('userAgentData', {
      brands: [
        { brand: 'Chromium', version: '120' },
        { brand: 'Definitely Firefox', version: '99' },
      ],
      mobile: false,
      platform: 'macOS',
    });

    const { isFirefox } = await importDetectBrowser();

    expect(isFirefox).toBe(false);
  });

  it('uses User-Agent Client Hints brands for Edge detection', async () => {
    setNavigatorProperty(
      'userAgent',
      'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    );
    setNavigatorProperty('userAgentData', {
      brands: [
        { brand: 'Chromium', version: '120' },
        { brand: 'Microsoft Edge', version: '120' },
      ],
      mobile: false,
      platform: 'Windows',
    });

    const { isEdge } = await importDetectBrowser();

    expect(isEdge).toBe(true);
  });

  it('falls back to the legacy user agent string for Edge detection', async () => {
    setNavigatorProperty(
      'userAgent',
      'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
    );
    setNavigatorProperty('userAgentData', undefined);

    const { isEdge } = await importDetectBrowser();

    expect(isEdge).toBe(true);
  });

  it('falls back to the legacy user agent string for legacy Edge detection', async () => {
    setNavigatorProperty(
      'userAgent',
      'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.102 Safari/537.36 Edge/18.19582',
    );
    setNavigatorProperty('userAgentData', undefined);

    const { isEdge } = await importDetectBrowser();

    expect(isEdge).toBe(true);
  });
});
