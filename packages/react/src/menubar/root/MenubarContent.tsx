import * as React from 'react';
import {
  useFloatingNodeId,
  useFloating,
  FloatingNode,
  FloatingFocusManager,
  useFloatingTree,
} from '@floating-ui/react';
import { CompositeList } from '../../composite/list/CompositeList';
import { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useForkRef } from '../../utils';
import { mergeProps } from '../../merge-props';
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
    setContentElement,
    itemDomElements,
    itemLabels,
    popupProps,
    hasSubmenuOpen,
    setHasSubmenuOpen,
  } = useMenubarRootContext();

  const nodeId = useFloatingNodeId();

  const mergedRef = useForkRef(forwardedRef, setContentElement);
  const { events: menuEvents } = useFloatingTree()!;

  useFloating({
    rootContext: floatingRootContext,
    nodeId,
  });

  const openSubmenus = React.useRef(new Set<string>());

  React.useEffect(() => {
    function onSubmenuOpenChange(event: { open: boolean; nodeId: string; parentNodeId: string }) {
      if (event.parentNodeId === nodeId) {
        if (event.open) {
          openSubmenus.current.add(event.nodeId);
        } else {
          openSubmenus.current.delete(event.nodeId);
        }

        setHasSubmenuOpen(openSubmenus.current.size > 0);
      }
    }

    menuEvents.on('openchange', onSubmenuOpenChange);

    return () => {
      menuEvents.off('openchange', onSubmenuOpenChange);
    };
  }, [menuEvents, nodeId, setHasSubmenuOpen]);

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
        <FloatingFocusManager
          context={floatingRootContext}
          disabled={!hasSubmenuOpen}
          modal={false}
          returnFocus={false}
          initialFocus={1}
        >
          {renderElement()}
        </FloatingFocusManager>
      </CompositeList>
    </FloatingNode>
  );
});
