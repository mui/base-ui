import * as React from 'react';
import { MenuOrientation } from '../../menu/root/useMenuRoot';
import { BaseUIComponentProps } from '../../utils/types';
import { Menu } from '../../menu';
import { MenubarPopup } from './MenubarPopup';
import { MenubarPositioner } from './MenubarPositioner';

/**
 *
 * Documentation: [Base UI Menubar](https://base-ui.com/react/components/menubar)
 */
const MenubarRoot = React.forwardRef(function MenubarRoot(
  props: MenubarRoot.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { orientation = 'horizontal', loop = true, disabled = false, ...otherProps } = props;

  return (
    <Menu.Root open modal={false} orientation={orientation} disabled={disabled} loop={loop}>
      <MenubarPositioner>
        <MenubarPopup ref={forwardedRef} {...otherProps}>
          {props.children}
        </MenubarPopup>
      </MenubarPositioner>
    </Menu.Root>
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
