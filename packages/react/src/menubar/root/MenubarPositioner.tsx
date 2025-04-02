import * as React from 'react';
import { CompositeList } from '@base-ui-components/react/composite/list/CompositeList';
import { useMenuRootContext } from '@base-ui-components/react/menu/root/MenuRootContext';
import { BaseUIComponentProps } from '@base-ui-components/react/utils/types';
import { useComponentRenderer } from '@base-ui-components/react/utils/useComponentRenderer';
import { useFloatingNodeId, useFloating, FloatingNode } from '@floating-ui/react';

const EMPTY_OBJECT = {};

export function MenubarPositioner(props: BaseUIComponentProps<'div', {}>) {
  const { className, render, ...otherProps } = props;

  const { floatingRootContext, setPositionerElement, itemDomElements, itemLabels } =
    useMenuRootContext();

  const nodeId = useFloatingNodeId();

  useFloating({
    rootContext: floatingRootContext,
    nodeId,
  });

  const { renderElement } = useComponentRenderer({
    render: render ?? 'div',
    className,
    state: EMPTY_OBJECT,
    ref: setPositionerElement,
    extraProps: {
      ...otherProps,
    },
  });

  return (
    <FloatingNode id={nodeId}>
      <CompositeList elementsRef={itemDomElements} labelsRef={itemLabels}>
        {renderElement()}
      </CompositeList>
    </FloatingNode>
  );
}
