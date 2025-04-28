'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useToastRootContext } from '../root/ToastRootContext';
import { useId } from '../../utils/useId';
import { useModernLayoutEffect } from '../../utils/useModernLayoutEffect';

/**
 * A description that describes the toast.
 * Can be used as the default message for the toast when no title is provided.
 * Renders a `<p>` element.
 *
 * Documentation: [Base UI Toast](https://base-ui.com/react/components/toast)
 */
const ToastDescription = React.forwardRef(function ToastDescription(
  props: ToastDescription.Props,
  forwardedRef: React.ForwardedRef<HTMLParagraphElement>,
) {
  const { render, className, id: idProp, children: childrenProp, ...other } = props;

  const { toast } = useToastRootContext();

  const children = childrenProp ?? toast.description;

  const shouldRender = Boolean(children);

  const id = useId(idProp);

  const { setDescriptionId } = useToastRootContext();

  useModernLayoutEffect(() => {
    if (!shouldRender) {
      return undefined;
    }

    setDescriptionId(id);

    return () => {
      setDescriptionId(undefined);
    };
  }, [shouldRender, id, setDescriptionId]);

  const state: ToastDescription.State = React.useMemo(
    () => ({
      type: toast.type,
    }),
    [toast.type],
  );

  const { renderElement } = useComponentRenderer({
    render: render ?? 'p',
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

namespace ToastDescription {
  export interface State {
    /**
     * The type of the toast.
     */
    type: string | undefined;
  }

  export interface Props extends BaseUIComponentProps<'p', State> {}
}

export { ToastDescription };
