import * as React from 'react';
import PropTypes from 'prop-types';
import type { SwitchRoot } from '../Root/SwitchRoot';
import { useSwitchRootContext } from '../Root/SwitchRootContext';
import { useSwitchStyleHooks } from '../Root/useSwitchStyleHooks';
import { resolveClassName } from '../../utils/resolveClassName';
import { evaluateRenderProp } from '../../utils/evaluateRenderProp';
import { useRenderPropForkRef } from '../../utils/useRenderPropForkRef';
import { useFieldRootContext } from '../../Field/Root/FieldRootContext';
import type { BaseUIComponentProps } from '../../utils/types';

function defaultRender(props: React.ComponentPropsWithRef<'span'>) {
  return <span {...props} />;
}

/**
 *
 * Demos:
 *
 * - [Switch](https://base-ui.netlify.app/components/react-switch/)
 *
 * API:
 *
 * - [SwitchThumb API](https://base-ui.netlify.app/components/react-switch/#api-reference-SwitchThumb)
 */
const SwitchThumb = React.forwardRef(function SwitchThumb(
  props: SwitchThumb.Props,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const { render: renderProp, className: classNameProp, ...other } = props;
  const render = renderProp ?? defaultRender;

  const { ownerState: fieldOwnerState } = useFieldRootContext();

  const ownerState = useSwitchRootContext();
  const extendedOwnerState = { ...fieldOwnerState, ...ownerState };

  const className = resolveClassName(classNameProp, extendedOwnerState);
  const styleHooks = useSwitchStyleHooks(extendedOwnerState);
  const mergedRef = useRenderPropForkRef(render, forwardedRef);

  const elementProps = {
    className,
    ref: mergedRef,
    ...styleHooks,
    ...other,
  };

  return evaluateRenderProp(render, elementProps, ownerState);
});

namespace SwitchThumb {
  export interface Props extends BaseUIComponentProps<'span', SwitchRoot.OwnerState> {}
}

SwitchThumb.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * Class names applied to the element or a function that returns them based on the component's state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { SwitchThumb };
