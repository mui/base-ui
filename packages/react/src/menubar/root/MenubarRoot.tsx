import * as React from 'react';
import {
  Composite,
  FloatingNode,
  FloatingTree,
  useFloatingNodeId,
  useFloatingTree,
} from '@floating-ui/react';
import { MenuOrientation } from '../../menu/root/useMenuRoot';
import { BaseUIComponentProps } from '../../utils/types';
import { useMenubarRoot } from './useMenubarRoot';
import { MenubarRootContext, useMenubarRootContext } from './MenubarRootContext';
import { useForkRef, useScrollLock } from '../../utils';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { InternalBackdrop } from '../../utils/InternalBackdrop';

const EMPTY_OBJECT = {};

/**
 *
 * Documentation: [Base UI Menubar](https://base-ui.com/react/components/menubar)
 */
const MenubarRoot = React.forwardRef(function MenubarRoot(
  props: MenubarRoot.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    orientation = 'horizontal',
    loop = true,
    render,
    className,
    modal = true,
    ...otherProps
  } = props;

  const menubarRoot = useMenubarRoot();
  const { contentElement, setContentElement, hasSubmenuOpen } = menubarRoot;

  const mergedRef = useForkRef(forwardedRef, setContentElement);

  useScrollLock({
    enabled: modal && hasSubmenuOpen,
    open: hasSubmenuOpen,
    mounted: hasSubmenuOpen,
    referenceElement: contentElement,
  });

  const { renderElement } = useComponentRenderer({
    render: render ?? 'div',
    className,
    state: EMPTY_OBJECT,
    ref: mergedRef,
    extraProps: otherProps,
  });

  return (
    <MenubarRootContext.Provider value={menubarRoot}>
      {modal && menubarRoot.hasSubmenuOpen && <InternalBackdrop />}
      <FloatingTree>
        <MenubarContent>
          <Composite render={renderElement()} orientation={orientation} loop={loop} />
        </MenubarContent>
      </FloatingTree>
    </MenubarRootContext.Provider>
  );
});

function MenubarContent(props: React.PropsWithChildren<{}>) {
  const nodeId = useFloatingNodeId();
  const { events: menuEvents } = useFloatingTree()!;
  const openSubmenus = React.useRef(new Set<string>());
  const rootContext = useMenubarRootContext();
  React.useEffect(() => {
    function onSubmenuOpenChange(event: { open: boolean; nodeId: string; parentNodeId: string }) {
      if (event.parentNodeId !== nodeId) {
        return;
      }

      if (event.open) {
        openSubmenus.current.add(event.nodeId);
      } else {
        openSubmenus.current.delete(event.nodeId);
      }

      rootContext.setHasSubmenuOpen(openSubmenus.current.size > 0);
    }

    menuEvents.on('openchange', onSubmenuOpenChange);

    return () => {
      menuEvents.off('openchange', onSubmenuOpenChange);
    };
  }, [menuEvents, nodeId, rootContext]);

  return <FloatingNode id={nodeId}>{props.children}</FloatingNode>;
}

namespace MenubarRoot {
  export interface State {}
  export interface Props extends BaseUIComponentProps<'div', State> {
    modal?: boolean;
    disabled?: boolean;
    orientation?: MenuOrientation;
    loop?: boolean;
  }
}

export { MenubarRoot };
