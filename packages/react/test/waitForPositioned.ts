import { expect } from 'vitest';
import { waitFor } from '@mui/internal-test-utils';

export async function waitForPositioned(positioner: HTMLElement) {
  await waitFor(() => {
    expect(positioner.style.opacity).not.toBe('0');
  });
  await waitFor(() => {
    expect(positioner).toBeVisible();
  });
}
