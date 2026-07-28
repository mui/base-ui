'use client';
import * as React from 'react';
import { useId } from '@base-ui/utils/useId';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useToastRootContext } from '../root/ToastRootContext';
import { hasRenderableChildren } from './isRenderableNode';

/**
 * Shared logic for `Toast.Title` and `Toast.Description`, which only differ by the rendered tag,
 * the fallback content, and which id setter they register with. Resolves the content and returns
 * the pieces each part passes to `useRenderElement` and `useToastLabelElement`.
 */
export function useToastLabelPart(
  idProp: string | undefined,
  childrenProp: React.ReactNode,
  part: 'title' | 'description',
) {
  const { toast, setTitleId, setDescriptionId } = useToastRootContext();

  const setId = part === 'title' ? setTitleId : setDescriptionId;
  const children = childrenProp ?? (part === 'title' ? toast.title : toast.description);

  const id = useId(idProp);

  return { id, children, type: toast.type, setId };
}

/**
 * Mounts the evaluated label element only when it carries renderable content (so a `render` prop's
 * own children count, while a childless styling-only `render` stays conditional), registering the
 * generated id with the root while the part renders.
 */
export function useToastLabelElement(
  element: React.ReactElement | null,
  id: string | undefined,
  setId: React.Dispatch<React.SetStateAction<string | undefined>>,
): React.ReactElement | null {
  const shouldRender = hasRenderableChildren(element);

  useIsoLayoutEffect(() => {
    if (!shouldRender) {
      return undefined;
    }

    setId(id);

    return () => {
      setId(undefined);
    };
  }, [shouldRender, id, setId]);

  return shouldRender ? element : null;
}
