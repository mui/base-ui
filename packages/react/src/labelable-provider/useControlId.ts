'use client';
import { useIsoLayoutEffect } from '@base-ui-components/utils/useIsoLayoutEffect';
import { useLabelableContext } from './LabelableContext';

export function useControlId(id: string | undefined) {
  const { controlId, setControlId } = useLabelableContext();

  useIsoLayoutEffect(() => {
    if (id && id !== controlId) {
      setControlId(id);
    }

    return () => {
      if (id) {
        setControlId(undefined);
      }
    };
  }, [id, controlId, setControlId]);
}
