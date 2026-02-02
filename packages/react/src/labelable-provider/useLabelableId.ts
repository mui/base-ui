'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { isElement } from '@floating-ui/utils/dom';
import { NOOP } from '../utils/noop';
import { useBaseUiId } from '../utils/useBaseUiId';
import { useLabelableContext } from './LabelableContext';

export function useLabelableId(params: useLabelableId.Parameters = {}) {
  const { id, implicit = false, controlRef } = params;
  const { controlId, registerControlId } = useLabelableContext();
  const defaultId = useBaseUiId(id);
  const controlIdForEffect = implicit ? controlId : undefined;
  const controlSourceRef = useRefWithInit(() => Symbol('labelable-control'));
  const hasRegisteredRef = React.useRef(false);

  useIsoLayoutEffect(() => {
    if (registerControlId === NOOP) {
      return undefined;
    }

    if (!implicit && !id) {
      if (hasRegisteredRef.current) {
        hasRegisteredRef.current = false;
        registerControlId(controlSourceRef.current, undefined);
      }
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
    } else {
      nextId = id;
    }

    hasRegisteredRef.current = true;
    registerControlId(controlSourceRef.current, nextId);

    return undefined;
  }, [
    id,
    controlRef,
    controlIdForEffect,
    registerControlId,
    implicit,
    defaultId,
    controlSourceRef,
  ]);

  React.useEffect(() => {
    const controlSource = controlSourceRef.current;

    return () => {
      if (!hasRegisteredRef.current || registerControlId === NOOP) {
        return;
      }

      hasRegisteredRef.current = false;
      registerControlId(controlSource, undefined);
    };
  }, [registerControlId, controlSourceRef]);

  return controlId ?? defaultId;
}

export interface UseLabelableIdParameters {
  id?: string | undefined;
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

export namespace useLabelableId {
  export type Parameters = UseLabelableIdParameters;
  export type ReturnValue = UseLabelableIdReturnValue;
}
