import PropTypes, { ValidationMap } from 'prop-types';

export const refType = PropTypes.oneOfType([PropTypes.func, PropTypes.object]);

export function HTMLElementType(
  props: { [key: string]: unknown },
  propName: string,
  componentName: string,
  location: string,
  propFullName: string,
): Error | null {
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  const propValue = props[propName];
  const safePropName = propFullName || propName;

  if (propValue == null) {
    return null;
  }

  if (propValue && (propValue as any).nodeType !== 1) {
    return new Error(
      `Invalid ${location} \`${safePropName}\` supplied to \`${componentName}\`. ` +
        `Expected an HTMLElement.`,
    );
  }

  return null;
}

const specialProperty = 'exact-prop: \u200b';

// This module is based on https://github.com/airbnb/prop-types-exact repository.
// However, in order to reduce the number of dependencies and to remove some extra safe checks
// the module was forked.
export function exactProp<T>(propTypes: ValidationMap<T>): ValidationMap<T> {
  if (process.env.NODE_ENV === 'production') {
    return propTypes;
  }

  return {
    ...propTypes,
    [specialProperty]: (props: { [key: string]: unknown }) => {
      const unsupportedProps = Object.keys(props).filter((prop) => !propTypes.hasOwnProperty(prop));
      if (unsupportedProps.length > 0) {
        return new Error(
          `The following props are not supported: ${unsupportedProps
            .map((prop) => `\`${prop}\``)
            .join(', ')}. Please remove them.`,
        );
      }
      return null;
    },
  };
}
