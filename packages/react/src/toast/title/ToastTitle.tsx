'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useToastRootContext } from '../root/ToastRootContext';
import { useModernLayoutEffect } from '../../utils/useModernLayoutEffect';
import { useId } from '../../utils/useId';

/**
 * A title that labels the toast.
 * Renders an `<h2>` element.
 *
 * Documentation: [Base UI Toast](https://base-ui.com/react/components/toast)
 */
export const ToastTitle = React.forwardRef(function ToastTitle(
  props: ToastTitle.Props,
  forwardedRef: React.ForwardedRef<HTMLHeadingElement>,
) {
  const { render, className, id: idProp, children: childrenProp, ...other } = props;

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

  const { renderElement } = useComponentRenderer({
    render: render ?? 'h2',
    ref: forwardedRef,
    className,
    state,
    extraProps: {
      ...other,
      id,
      children,
    },
  });

  if (!shouldRender) {
    return null;
  }

  return renderElement();
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
