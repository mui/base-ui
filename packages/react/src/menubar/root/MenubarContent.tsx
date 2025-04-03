import * as React from 'react';
import { CompositeList } from '@base-ui-components/react/composite/list/CompositeList';
import { BaseUIComponentProps } from '@base-ui-components/react/utils/types';
import { useComponentRenderer } from '@base-ui-components/react/utils/useComponentRenderer';
import {
  useFloatingNodeId,
  useFloating,
  FloatingNode,
  FloatingFocusManager,
} from '@floating-ui/react';
import { useForkRef } from '@base-ui-components/react/utils';
import { mergeProps } from '@base-ui-components/react/merge-props';
import { useMenubarRootContext } from './MenubarRootContext';

const EMPTY_OBJECT = {};

/**
 * @internal
 */
export const MenubarContent = React.forwardRef(function MenubarContent(
  props: BaseUIComponentProps<'div', {}>,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, ...otherProps } = props;

  const {
    floatingRootContext,
    setPositionerElement,
    itemDomElements,
    itemLabels,
    popupRef,
    popupProps,
  } = useMenubarRootContext();

  const nodeId = useFloatingNodeId();

  const mergedRef = useForkRef(forwardedRef, setPositionerElement, popupRef);

  useFloating({
    rootContext: floatingRootContext,
    nodeId,
  });

  const { renderElement } = useComponentRenderer({
    render: render ?? 'div',
    className,
    state: EMPTY_OBJECT,
    ref: mergedRef,
    extraProps: mergeProps(popupProps, otherProps),
  });

  return (
    <FloatingNode id={nodeId}>
      <CompositeList elementsRef={itemDomElements} labelsRef={itemLabels}>
        <FloatingFocusManager context={floatingRootContext} modal={false}>
          {renderElement()}
        </FloatingFocusManager>
      </CompositeList>
    </FloatingNode>
  );
});
