type Cleanup = false | null | undefined | (() => void);

export function mergeCleanups(...cleanups: Cleanup[]) {
  return () => {
    for (let i = 0; i < cleanups.length; i += 1) {
      const cleanup = cleanups[i];
      if (cleanup) {
        cleanup();
      }
    }
  };
}
