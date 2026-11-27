'use client';
import type * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useBaseUiId } from '../internals/useBaseUiId';
import { resolveRenderedId } from '../internals/resolveRenderedId';

export function useRegisteredLabelId(
  props: { id?: string | undefined; render?: unknown },
  setLabelId: React.Dispatch<React.SetStateAction<string | undefined>>,
): string | undefined {
  const defaultId = useBaseUiId(props.id);
  const id = resolveRenderedId(props, defaultId) || undefined;

  useIsoLayoutEffect(() => {
    // An id-less label releases only its own id, in the cleanup of its previous id.
    if (id === undefined) {
      return undefined;
    }

    setLabelId(id);
    return () => {
      setLabelId((currentId) => (currentId === id ? undefined : currentId));
    };
  }, [id, setLabelId]);

  return id;
}
