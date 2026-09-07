import { flushMicrotasks } from '@mui/internal-test-utils';
import type { Clock } from '@mui/internal-test-utils/createRenderer';

export async function advanceReactClock(clock: Clock, milliseconds: number) {
  await flushMicrotasks();
  await clock.tickAsync(milliseconds);
  await flushMicrotasks();
}
