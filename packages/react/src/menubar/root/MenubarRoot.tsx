import * as React from 'react';
import { FloatingTree } from '@floating-ui/react';
import { MenuOrientation } from '../../menu/root/useMenuRoot';
import { BaseUIComponentProps } from '../../utils/types';
import { MenubarContent } from './MenubarContent';
import { useMenubarRoot } from './useMenubarRoot';
import { MenubarRootContext } from './MenubarRootContext';

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
    disabled = false,
    children,
    ...otherProps
  } = props;

  const menubarRoot = useMenubarRoot({
    disabled,
    loop,
    orientation,
  });

  return (
    <FloatingTree>
      <MenubarRootContext.Provider value={menubarRoot}>
        <MenubarContent ref={forwardedRef} {...otherProps}>
          {children}
        </MenubarContent>
      </MenubarRootContext.Provider>
    </FloatingTree>
  );
});

namespace MenubarRoot {
  export interface State {}
  export interface Props extends BaseUIComponentProps<'div', State> {
    disabled?: boolean;
    orientation?: MenuOrientation;
    loop?: boolean;
  }
}

export { MenubarRoot };
