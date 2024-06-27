'use client';
import * as React from 'react';
import PropTypes from 'prop-types';

interface FormContextValue {
  labelId: string | undefined;
  setLabelId: React.Dispatch<React.SetStateAction<string | undefined>>;
}

interface FormProviderProps {
  children: React.ReactNode;
}

export const FormContext = React.createContext<FormContextValue | null>(null);

/**
 * @ignore - internal component.
 */
function FormProvider(props: FormProviderProps) {
  const { children } = props;

  const [labelId, setLabelId] = React.useState<string | undefined>(undefined);

  const contextValue = React.useMemo(() => ({ labelId, setLabelId }), [labelId]);

  return <FormContext.Provider value={contextValue}>{children}</FormContext.Provider>;
}

FormProvider.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.node,
} as any;

export { FormProvider };

export function useFormContext() {
  const context = React.useContext(FormContext);
  if (context === null) {
    throw new Error('Missing FormContext');
  }
  return context;
}
