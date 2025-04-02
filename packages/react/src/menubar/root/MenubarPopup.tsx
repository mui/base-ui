import * as React from 'react';
import { useMenuRootContext } from '@base-ui-components/react/menu/root/MenuRootContext';
import { mergeProps } from '@base-ui-components/react/merge-props';
import { useForkRef } from '@base-ui-components/react/utils';
import { BaseUIComponentProps } from '@base-ui-components/react/utils/types';
import { useComponentRenderer } from '@base-ui-components/react/utils/useComponentRenderer';
import { FloatingFocusManager } from '@floating-ui/react';

export const MenubarPopup = React.forwardRef(function FakePopup(
  props: BaseUIComponentProps<'div', {}>,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, ...other } = props;
  const { floatingRootContext, popupProps, popupRef } = useMenuRootContext();

  const mergedRef = useForkRef(forwardedRef, popupRef);

  const { renderElement } = useComponentRenderer({
    render: render || 'div',
    className,
    state: {},
    extraProps: mergeProps(popupProps, other),
    ref: mergedRef,
  });

  return (
    <FloatingFocusManager context={floatingRootContext} modal={false}>
      {renderElement()}
    </FloatingFocusManager>
  );
});
