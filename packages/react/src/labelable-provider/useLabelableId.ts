'use client';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { isElement } from '@floating-ui/utils/dom';
import { NOOP } from '../utils/noop';
import { useBaseUiId } from '../utils/useBaseUiId';
import { useLabelableContext } from './LabelableContext';

export function useLabelableId(params: useLabelableId.Parameters = {}) {
  const { id, implicit = false, controlRef } = params;
  const { controlId, setControlId } = useLabelableContext();
  const defaultId = useBaseUiId(id);

  useIsoLayoutEffect(() => {
    if ((!implicit && !id) || setControlId === NOOP) {
      return undefined;
    }

    if (implicit) {
      const elem = controlRef?.current;

      if (isElement(elem) && elem.closest('label') != null) {
        setControlId(id ?? null);
      } else {
        setControlId(controlId ?? defaultId);
      }
    } else if (id) {
      setControlId(id);
    }

    return () => {
      if (id) {
        setControlId(undefined);
      }
    };
  }, [id, controlRef, controlId, setControlId, implicit, defaultId]);

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
