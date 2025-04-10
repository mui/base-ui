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
import { MenubarRootContext } from './MenubarRootContext';
import { useForkRef } from '../../utils';
import { useComponentRenderer } from '../../utils/useComponentRenderer';

const EMPTY_OBJECT = {};

/**
 *
 * Documentation: [Base UI Menubar](https://base-ui.com/react/components/menubar)
 */
const MenubarRoot = React.forwardRef(function MenubarRoot(
  props: MenubarRoot.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { orientation = 'horizontal', loop = true, render, className, ...otherProps } = props;

  const menubarRoot = useMenubarRoot();

  const mergedRef = useForkRef(forwardedRef, menubarRoot.setContentElement);

  const { renderElement } = useComponentRenderer({
    render: render ?? 'div',
    className,
    state: EMPTY_OBJECT,
    ref: mergedRef,
    extraProps: otherProps,
  });

  return (
    <MenubarRootContext.Provider value={menubarRoot}>
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
  return <FloatingNode id={nodeId}>{props.children}</FloatingNode>;
}

namespace MenubarRoot {
  export interface State {}
  export interface Props extends BaseUIComponentProps<'div', State> {
    disabled?: boolean;
    orientation?: MenuOrientation;
    loop?: boolean;
  }
}

export { MenubarRoot };
