import { act, screen } from '@mui/internal-test-utils';

/**
 * Resets a form from script. The browser restores default values before React commits.
 */
export async function resetForm(form = screen.getByTestId<HTMLFormElement>('form')) {
  await act(async () => {
    form.reset();
  });
}

/**
 * Clicks a reset button with a trusted click, which lets React commit between the `reset` event
 * and the browser restoring default values. Browser-only.
 */
export async function clickResetButton(button = screen.getByRole('button', { name: 'Reset' })) {
  const { userEvent } = await import('vitest/browser');
  const reactGlobals = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };
  const actEnvironment = reactGlobals.IS_REACT_ACT_ENVIRONMENT;
  // `act()` would defer React's commit past the restore, hiding the ordering under test.
  reactGlobals.IS_REACT_ACT_ENVIRONMENT = false;
  try {
    await userEvent.click(button);
  } finally {
    reactGlobals.IS_REACT_ACT_ENVIRONMENT = actEnvironment;
  }
}
