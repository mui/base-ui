import useEnhancedEffect from '@mui/utils/useEnhancedEffect';
import * as React from 'react';
import type { Status } from './useTransitionStatus.types';

/**
 * @ignore - internal hook.
 */
export function useTransitionStatus(trigger: boolean) {
  const [status, setStatus] = React.useState<Status>('unmounted');
  const [mounted, setMounted] = React.useState(trigger);

  if (trigger && !mounted) {
    setMounted(true);
  }

  useEnhancedEffect(() => {
    if (trigger) {
      setStatus('initial');

      const frame = requestAnimationFrame(() => {
        setStatus('opening');
      });

      return () => {
        cancelAnimationFrame(frame);
      };
    }

    setStatus('closing');

    return undefined;
  }, [trigger]);

  return {
    mounted,
    setMounted,
    status,
  };
}
