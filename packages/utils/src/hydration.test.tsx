import * as React from 'react';
import { afterEach, expect, vi, describe, it } from 'vitest';
import { createRenderer, screen } from '@mui/internal-test-utils';
import { useIsHydrated, useIsHydrating } from './hydration';
import { isJSDOM } from './testUtils';

function createProbe(hook: () => boolean, testId: string) {
  return function Probe() {
    return <span data-testid={testId}>{hook() ? 'yes' : 'no'}</span>;
  };
}

describe('hydration', () => {
  const { render, renderToString } = createRenderer();

  describe('useIsHydrated', () => {
    const Probe = createProbe(useIsHydrated, 'hydrated');

    it('reports hydrated once mounted on the client', () => {
      render(<Probe />);

      expect(screen.getByTestId('hydrated')).toHaveTextContent('yes');
    });

    it('does not report hydrated while rendering on the server', () => {
      renderToString(<Probe />);

      expect(screen.getByTestId('hydrated')).toHaveTextContent('no');
    });
  });

  describe('useIsHydrating', () => {
    const Probe = createProbe(useIsHydrating, 'hydrating');

    it('does not report hydrating for a client-only mount', () => {
      render(<Probe />);

      expect(screen.getByTestId('hydrating')).toHaveTextContent('no');
    });

    it('reports hydrating while rendering on the server', () => {
      renderToString(<Probe />);

      expect(screen.getByTestId('hydrating')).toHaveTextContent('yes');
    });
  });

  // The React 17 paths cannot be reached by the majors under test, so force the
  // version branch and re-import. The shim's own fallback takes only two
  // arguments and drops the server snapshot, which is what each path works
  // around — differently, because the safe degradation differs per hook.
  // Module mocking only takes effect in the jsdom environment; in the browser
  // these would silently exercise the modern path instead.
  describe.skipIf(!isJSDOM)('React 17 paths', () => {
    afterEach(() => {
      vi.doUnmock('./reactVersion');
      vi.doUnmock('use-sync-external-store/shim');
      vi.resetModules();
    });

    async function loadLegacy() {
      vi.doMock('./reactVersion', () => ({ isReactVersionAtLeast: () => false }));
      vi.doMock('use-sync-external-store/shim', () => ({
        useSyncExternalStore: (_subscribe: unknown, getClientSnapshot: () => boolean) =>
          getClientSnapshot(),
      }));
      vi.resetModules();
      return import('./hydration');
    }

    it('never reports hydrated on the server', async () => {
      const legacy = await loadLegacy();
      const Probe = createProbe(legacy.useIsHydrated, 'hydrated');

      renderToString(<Probe />);

      expect(screen.getByTestId('hydrated')).toHaveTextContent('no');
    });

    it('reports hydrated once mounted on the client', async () => {
      const legacy = await loadLegacy();
      const Probe = createProbe(legacy.useIsHydrated, 'hydrated');

      render(<Probe />);

      expect(screen.getByTestId('hydrated')).toHaveTextContent('yes');
    });

    // `useState` cannot tell hydration from a client-only mount on React 17, so
    // the inverse reports hydrating until the mount effect runs. React 18+
    // distinguishes the two through the server snapshot.
    it('reports hydrating while rendering on the server', async () => {
      const legacy = await loadLegacy();
      const Probe = createProbe(legacy.useIsHydrating, 'hydrating');

      renderToString(<Probe />);

      expect(screen.getByTestId('hydrating')).toHaveTextContent('yes');
    });

    it('stops reporting hydrating once mounted on the client', async () => {
      const legacy = await loadLegacy();
      const Probe = createProbe(legacy.useIsHydrating, 'hydrating');

      render(<Probe />);

      expect(screen.getByTestId('hydrating')).toHaveTextContent('no');
    });
  });
});
