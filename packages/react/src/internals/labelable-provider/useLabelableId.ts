'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { NOOP } from '../noop';
import { useBaseUiId } from '../useBaseUiId';
import { useLabelableContext } from './LabelableContext';

export function useLabelableId(params: UseLabelableIdParameters = {}) {
  const { id, enabled = true, preferId = false } = params;

  const { controlId, registerControlId } = useLabelableContext();

  const defaultId = useBaseUiId();

  const controlSourceRef = useRefWithInit(() => Symbol());
  const hasRegisteredRef = React.useRef(false);
  const hadExplicitIdRef = React.useRef(id != null);

  const unregisterControlId = useStableCallback(() => {
    if (!hasRegisteredRef.current || registerControlId === NOOP) {
      return;
    }

    hasRegisteredRef.current = false;
    registerControlId(controlSourceRef.current, undefined);
  });

  useIsoLayoutEffect(() => {
    if (registerControlId === NOOP) {
      return undefined;
    }

    if (!enabled) {
      hadExplicitIdRef.current = false;
      unregisterControlId();
      return undefined;
    }

    let nextId: string | undefined;

    if (id != null) {
      hadExplicitIdRef.current = true;
      nextId = id;
    } else if (hadExplicitIdRef.current) {
      nextId = defaultId;
    }

    // Either the control never had an explicit `id`, or the React 17 fallback id
    // has not been assigned yet. Neither is worth registering.
    if (nextId === undefined) {
      unregisterControlId();
      return undefined;
    }

    hasRegisteredRef.current = true;
    registerControlId(controlSourceRef.current, nextId, preferId);

    return undefined;
  }, [id, enabled, registerControlId, defaultId, preferId, controlSourceRef, unregisterControlId]);

  React.useEffect(() => {
    return unregisterControlId;
  }, [unregisterControlId]);

  // Don't let an explicit `id` preempt the provider's selected id: during SSR the label
  // renders `htmlFor` from the provider's pre-registration state, and preempting it here
  // would desynchronize the pair until hydration.
  return controlId ?? id ?? defaultId;
}

export interface UseLabelableIdParameters {
  id?: string | undefined;
  /**
   * Whether the control owns the label association.
   * @default true
   */
  enabled?: boolean | undefined;
  /**
   * Whether the registered id should replace the currently selected id.
   * @default false
   */
  preferId?: boolean | undefined;
}

export type UseLabelableIdReturnValue = string;

export interface UseLabelableIdState {}
