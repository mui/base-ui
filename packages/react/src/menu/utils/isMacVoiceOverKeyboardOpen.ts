import { REASONS, type BaseUIEventReason } from '../../internals/reasons';
import { isMacVoiceOver } from './isMacVoiceOver';

export function isMacVoiceOverKeyboardOpen(
  reason: BaseUIEventReason | null,
  openEvent: Event | undefined,
) {
  return (
    isMacVoiceOver() &&
    (reason === REASONS.listNavigation ||
      (reason === REASONS.triggerPress && isKeyboardLikeOpenEvent(openEvent)))
  );
}

function isKeyboardLikeOpenEvent(openEvent: Event | undefined) {
  if (!openEvent) {
    return false;
  }

  if (openEvent.type === 'keydown' || openEvent.type === 'keyup') {
    return true;
  }

  return openEvent.type === 'click' && (openEvent as MouseEvent).detail === 0;
}
