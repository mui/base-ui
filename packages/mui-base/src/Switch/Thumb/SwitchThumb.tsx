import * as React from 'react';
import PropTypes from 'prop-types';
import { SwitchThumbProps } from './SwitchThumb.types';
import { SwitchContext } from '../Root/SwitchContext';
import { useSwitchStyleHooks } from '../Root/useSwitchStyleHooks';
import { resolveClassName } from '../../utils/resolveClassName';
import { evaluateRenderProp } from '../../utils/evaluateRenderProp';
import { useRenderPropForkRef } from '../../utils/useRenderPropForkRef';

function defaultRender(props: React.ComponentPropsWithRef<'span'>) {
  return <span {...props} />;
}

const SwitchThumb = React.forwardRef(function SwitchThumb(
  props: SwitchThumbProps,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const { render: renderProp, className: classNameProp, ...other } = props;
  const render = renderProp ?? defaultRender;

  const ownerState = React.useContext(SwitchContext);
  if (ownerState === null) {
    throw new Error('Base UI: Switch.Thumb is not placed inside the Switch component.');
  }

  const className = resolveClassName(classNameProp, ownerState);
  const styleHooks = useSwitchStyleHooks(ownerState);
  const mergedRef = useRenderPropForkRef(render, forwardedRef);

  const elementProps = {
    className,
    ref: mergedRef,
    ...styleHooks,
    ...other,
  };

  return evaluateRenderProp(render, elementProps, ownerState);
});

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
