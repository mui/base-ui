'use client';
import * as React from 'react';
import { useId } from '@base-ui/utils/useId';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useToastRootContext } from '../root/ToastRootContext';

/**
 * Shared logic for `Toast.Title` and `Toast.Description`, which only differ by the rendered tag,
 * the fallback content, and which id setter they register with. Resolves the content, registers the
 * generated id with the root while the part renders, and returns the pieces each part passes to
 * `useRenderElement`.
 */
export function useToastLabelPart(
  idProp: string | undefined,
  childrenProp: React.ReactNode,
  part: 'title' | 'description',
) {
  const { toast, setTitleId, setDescriptionId } = useToastRootContext();

  const setId = part === 'title' ? setTitleId : setDescriptionId;
  const children = childrenProp ?? (part === 'title' ? toast.title : toast.description);
  const shouldRender = Boolean(children);

  const id = useId(idProp);

  useIsoLayoutEffect(() => {
    if (!shouldRender) {
      return undefined;
    }

    setId(id);

    return () => {
      setId(undefined);
    };
  }, [shouldRender, id, setId]);

  return { id, children, shouldRender, type: toast.type };
}
