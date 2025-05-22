'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../../utils/types';
import { useToastRootContext } from '../root/ToastRootContext';
import { useModernLayoutEffect } from '../../utils/useModernLayoutEffect';
import { useId } from '../../utils/useId';
import { useRenderElement } from '../../utils/useRenderElement';

/**
 * A title that labels the toast.
 * Renders an `<h2>` element.
 *
 * Documentation: [Base UI Toast](https://base-ui.com/react/components/toast)
 */
export const ToastTitle = React.forwardRef(function ToastTitle(
  componentProps: ToastTitle.Props,
  forwardedRef: React.ForwardedRef<HTMLHeadingElement>,
) {
  const { render, className, id: idProp, children: childrenProp, ...elementProps } = componentProps;

  const { toast } = useToastRootContext();

  const children = childrenProp ?? toast.title;

  const shouldRender = Boolean(children);

  const id = useId(idProp);

  const { setTitleId } = useToastRootContext();

  useModernLayoutEffect(() => {
    if (!shouldRender) {
      return undefined;
    }

    setTitleId(id);

    return () => {
      setTitleId(undefined);
    };
  }, [shouldRender, id, setTitleId]);

  const state: ToastTitle.State = React.useMemo(
    () => ({
      type: toast.type,
    }),
    [toast.type],
  );

  const element = useRenderElement('h2', componentProps, {
    ref: forwardedRef,
    state,
    props: {
      ...elementProps,
      id,
      children,
    },
  });

  if (!shouldRender) {
    return null;
  }

  return element;
});

export namespace ToastTitle {
  export interface State {
    /**
     * The type of the toast.
     */
    type: string | undefined;
  }

  export interface Props extends BaseUIComponentProps<'h2', State> {}
}
