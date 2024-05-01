import { act } from '@mui/internal-test-utils';

export function throwMissingPropError(field: string): never {
  throw new Error(`missing "${field}" in options

  > describeConformance(element, () => options)
`);
}

export async function waitForAsyncTasks() {
  await act(async () => {
    // Wait for positioning and focus management tasks to complete.
    await new Promise((resolve) => {
      requestAnimationFrame(resolve);
    });
  });
}
