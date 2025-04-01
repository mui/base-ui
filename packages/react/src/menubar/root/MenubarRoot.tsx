import * as React from 'react';
import PropTypes from 'prop-types';
import { FloatingTree } from '@floating-ui/react';
import { MenubarRootContext } from './MenubarRootContext';
import { MenuOrientation } from '../../menu/root/useMenuRoot';
import { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { CompositeRoot } from '../../composite/root/CompositeRoot';

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
    render,
    className,
    orientation = 'horizontal',
    loop = true,
    disabled = false,
    openOnHover = false,
    delay = 100,
    ...otherProps
  } = props;

  const { renderElement } = useComponentRenderer({
    render: render ?? 'div',
    ref: forwardedRef,
    extraProps: {
      role: 'menubar',
      ...otherProps,
    },
    state: EMPTY_OBJECT,
    className,
  });

  return (
    <FloatingTree>
      <MenubarRootContext.Provider value={EMPTY_OBJECT}>
        <CompositeRoot>{renderElement()}</CompositeRoot>
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
    openOnHover?: boolean;
    delay?: number;
  }
}

MenubarRoot.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * CSS class applied to the element, or a function that
   * returns a class based on the component’s state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * Allows you to replace the component’s HTML element
   * with a different tag, or compose it with another component.
   *
   * Accepts a `ReactElement` or a function that returns the element to render.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { MenubarRoot };
