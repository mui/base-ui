import * as React from 'react';

/**
 * Consume a context but throw when used outside of a provider.
 */
export function useNonNullableContext<T>(context: React.Context<T>): NonNullable<T> {
  const maybeContext = React.useContext(context);
  if (maybeContext === null || maybeContext === undefined) {
    const ctxName = context.displayName || 'Context';
    throw new Error(`Base UI: ${ctxName} is missing.`);
  }
  return maybeContext;
}

export function useNonNullablePartContext<T>(
  context: React.Context<T>,
  componentName: string,
  partName: string,
): NonNullable<T> {
  const maybeContext = React.useContext(context);
  if (maybeContext === null || maybeContext === undefined) {
    const ctxName = context.displayName || 'Context';
    throw new Error(
      `Base UI: ${ctxName} is missing. ${componentName} parts must be placed within <${componentName}.${partName}>.`,
    );
  }
  return maybeContext;
}
