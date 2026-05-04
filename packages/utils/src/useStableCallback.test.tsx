import { expect, vi } from 'vitest';

describe('useStableCallback', () => {
  it("doesn't read random values at module scope", async () => {
    vi.resetModules();

    const random = vi.spyOn(Math, 'random').mockImplementation(() => {
      throw new Error('Math.random() should not be called during module evaluation.');
    });

    try {
      await expect(import('./useStableCallback')).resolves.toHaveProperty('useStableCallback');
      expect(random).not.toHaveBeenCalled();
    } finally {
      random.mockRestore();
    }
  });
});
