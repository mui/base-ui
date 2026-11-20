'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useBaseUiId } from '../../internals/useBaseUiId';

export function useFallbackId() {
  const defaultId = useBaseUiId();
  // `undefined` uses the initial generated fallback; `null` means the element unmounted.
  const [registeredId, setRegisteredId] = React.useState<string | null | undefined>();
  const id = registeredId === null ? undefined : (registeredId ?? defaultId);
  return [defaultId, id, setRegisteredId] as const;
}

export function useRegisterFallbackId(
  idProp: string | undefined,
  defaultId: string | undefined,
  setRegisteredId: React.Dispatch<React.SetStateAction<string | null | undefined>>,
) {
  const registeredId = idProp || undefined;
  useIsoLayoutEffect(() => {
    setRegisteredId((currentId) => registeredId ?? (currentId === null ? undefined : currentId));
    return () => {
      setRegisteredId((currentId) => (currentId === registeredId ? null : currentId));
    };
  }, [registeredId, setRegisteredId]);
  return registeredId ?? defaultId;
}
