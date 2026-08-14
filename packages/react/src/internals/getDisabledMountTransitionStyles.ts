import { EMPTY_OBJECT } from '@base-ui/utils/empty';
import { DISABLED_TRANSITIONS_STYLE } from './constants';
import type { TransitionStatus } from './useTransitionStatus';

export function getDisabledMountTransitionStyles(transitionStatus: TransitionStatus): {
  style?: React.CSSProperties | undefined;
} {
  return transitionStatus === 'starting' ? DISABLED_TRANSITIONS_STYLE : EMPTY_OBJECT;
}
