import { Portal } from '../../portal/Portal';
import PropTypes from 'prop-types';
/**
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
function SelectPortal(props: SelectPortal.Props) {
  const { children, container } = props;
  return (
    <Portal container={container} keepMounted>
      {children}
    </Portal>
  );
}

SelectPortal.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * The container to render the portal element into.
   */
  container: PropTypes.oneOfType([
    (props, propName) => {
      if (props[propName] == null) {
        return new Error(`Prop '${propName}' is required but wasn't specified`);
      }
      if (typeof props[propName] !== 'object' || props[propName].nodeType !== 1) {
        return new Error(`Expected prop '${propName}' to be of type Element`);
      }
      return null;
    },
    PropTypes.shape({
      current: (props, propName) => {
        if (props[propName] == null) {
          return null;
        }
        if (typeof props[propName] !== 'object' || props[propName].nodeType !== 1) {
          return new Error(`Expected prop '${propName}' to be of type Element`);
        }
        return null;
      },
    }),
  ]),
} as any;

namespace SelectPortal {
  export interface Props extends Omit<Portal.Props, 'keepMounted'> {}
  export interface State extends Portal.State {}
}

export { SelectPortal };
