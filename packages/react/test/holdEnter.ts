import type { UserEvent } from '@testing-library/user-event';
import { act, fireEvent } from '@mui/internal-test-utils';
import { waitSingleFrame } from './wait';

/**
 * Holds Enter down like a user would: one press, a pause that lets focus move (for example into
 * a popup the press opened), then OS auto-repeat keydowns at whatever has focus, then the release.
 * Resolves with whether each repeat's default action (such as a native button's click) was allowed.
 */
export async function holdEnter(user: UserEvent, repeats = 3) {
  await user.keyboard('{Enter>}');
  await act(async () => {
    await waitSingleFrame();
    await waitSingleFrame();
  });

  const allowed: boolean[] = [];
  for (let i = 0; i < repeats; i += 1) {
    allowed.push(
      fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Enter', repeat: true }),
    );
  }

  await user.keyboard('{/Enter}');
  return allowed;
}
