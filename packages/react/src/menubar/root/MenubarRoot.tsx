import * as React from 'react';
import {
  FloatingNode,
  useFloating,
  useFloatingNodeId,
  useFloatingParentNodeId,
} from '@floating-ui/react';
import { MenuOrientation } from '../../menu/root/useMenuRoot';
import { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useMenuRootContext } from '../../menu/root/MenuRootContext';
import { Menu } from '../../menu';
import { MenuPortalContext } from '../../menu/portal/MenuPortalContext';
import { CompositeList } from '../../composite/list/CompositeList';
import { useForkRef } from '../../utils';
import { InternalBackdrop } from '../../utils/InternalBackdrop';
import { inertValue } from '../../utils/inertValue';

const EMPTY_OBJECT = {};

const FakePositioner = React.forwardRef(function FakePositioner(
  props: BaseUIComponentProps<'div', {}>,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, ...otherProps } = props;

  const {
    open,
    floatingRootContext,
    setPositionerElement,
    itemDomElements,
    itemLabels,
    modal,
    openReason,
  } = useMenuRootContext();

  const nodeId = useFloatingNodeId();
  const parentNodeId = useFloatingParentNodeId();

  useFloating({
    rootContext: floatingRootContext,
    nodeId,
  });

  const mergedRef = useForkRef(forwardedRef, setPositionerElement);

  const { renderElement } = useComponentRenderer({
    render: render ?? 'div',
    className,
    state: EMPTY_OBJECT,
    ref: mergedRef,
    extraProps: {
      ...otherProps,
    },
  });

  return (
    <React.Fragment>
      {modal && openReason !== 'hover' && parentNodeId === null && (
        <InternalBackdrop inert={inertValue(!open)} />
      )}
      <FloatingNode id={nodeId}>
        <CompositeList elementsRef={itemDomElements} labelsRef={itemLabels}>
          {renderElement()}
        </CompositeList>
      </FloatingNode>
    </React.Fragment>
  );
});

/**
 *
 * Documentation: [Base UI Menubar](https://base-ui.com/react/components/menubar)
 */
const MenubarRoot = React.forwardRef(function MenubarRoot(
  props: MenubarRoot.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    render,
    className,
    orientation = 'horizontal',
    loop = true,
    disabled = false,
    ...otherProps
  } = props;

  return (
    <FakeRoot>
      <FakePortal>
        <FakePositioner>
          <FakePopup className={typeof className === 'string' ? className : undefined}>
            {props.children}
          </FakePopup>
        </FakePositioner>
      </FakePortal>
    </FakeRoot>
  );
});

function FakeRoot(props: React.PropsWithChildren) {
  return (
    <Menu.Root open modal={false} orientation="horizontal">
      {props.children}
    </Menu.Root>
  );
}

function FakePortal(props: React.PropsWithChildren) {
  return (
    <div>
      <MenuPortalContext.Provider value>{props.children}</MenuPortalContext.Provider>
    </div>
  );
}

function FakePopup(props: React.ComponentPropsWithoutRef<'div'>) {
  return <Menu.Popup {...props} />;
}

namespace MenubarRoot {
  export interface State {}
  export interface Props extends BaseUIComponentProps<'div', State> {
    disabled?: boolean;
    orientation?: MenuOrientation;
    loop?: boolean;
    openOnHover?: boolean;
    delay?: number;
  }
}

export { MenubarRoot };
