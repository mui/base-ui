'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { isElement } from '@floating-ui/utils/dom';
import { NOOP } from '../noop';
import { useBaseUiId } from '../useBaseUiId';
import { useLabelableContext } from './LabelableContext';

export function useLabelableId(params: UseLabelableIdParameters = {}) {
  const { id, implicit = false, controlRef, enabled = true } = params;

  const { controlId, registerControlId } = useLabelableContext();

  // Deliberately not seeded with `id`: on React 17 the seed would stick around after the
  // `id` prop is removed, leaving the control on a stale id forever.
  const defaultId = useBaseUiId();

  const controlIdForEffect = implicit ? controlId : undefined;

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
      unregisterControlId();
      return undefined;
    }

    let nextId: string | null | undefined;

    if (implicit) {
      const elem = controlRef?.current;

      if (isElement(elem) && elem.closest('label') != null) {
        nextId = id ?? null;
      } else {
        nextId = controlIdForEffect ?? defaultId;
      }
    } else if (id !== undefined) {
      hadExplicitIdRef.current = true;
      nextId = id;
    } else if (hadExplicitIdRef.current) {
      nextId = defaultId;
    }

    // Either the control never had an explicit `id`, or React 17 has not assigned the
    // fallback id yet. Neither is worth registering.
    if (nextId === undefined) {
      unregisterControlId();
      return undefined;
    }

    hasRegisteredRef.current = true;
    registerControlId(controlSourceRef.current, nextId);

    return undefined;
  }, [
    id,
    enabled,
    controlRef,
    controlIdForEffect,
    registerControlId,
    implicit,
    defaultId,
    controlSourceRef,
    unregisterControlId,
  ]);

  React.useEffect(() => {
    return unregisterControlId;
  }, [unregisterControlId]);

  if (!enabled) {
    return id ?? defaultId;
  }

  // The provider's id wins until registration runs: the label renders `htmlFor` from the
  // provider's pre-registration state, so preempting it with an explicit `id` here would
  // leave the pair unassociated in server-rendered markup.
  return controlId ?? id ?? defaultId;
}

export interface UseLabelableIdParameters {
  /**
   * The control's `id`. Pass `null` for a control that takes its name from `aria-labelledby`
   * instead, so that the label omits `htmlFor`.
   */
  id?: string | null | undefined;
  /**
   * Whether the control owns the label association of its labelable scope.
   * @default true
   */
  enabled?: boolean | undefined;
  /**
   * Whether implicit labelling is supported.
   * @default false
   */
  implicit?: boolean | undefined;
  /**
   * A ref to an element that can be implicitly labelled.
   */
  controlRef?: React.RefObject<HTMLElement | null> | undefined;
}

export type UseLabelableIdReturnValue = string;

export interface UseLabelableIdState {}
