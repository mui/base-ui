'use client';
import * as React from 'react';
import { useEnhancedEffect } from '@base-ui-components/react/utils';

export interface DemoVariantSelectorContext {
  selectedVariant: string;
  setSelectedVariant: (variant: string) => void;
  selectedLanguage: string;
  setSelectedLanguage: (language: string) => void;
}

export const DemoVariantSelectorContext = React.createContext<DemoVariantSelectorContext | null>(
  null,
);

export const useDemoVariantSelectorContext = () => {
  const context = React.useContext(DemoVariantSelectorContext);
  if (!context) {
    throw new Error('Missing DemoVariantSelectorContext');
  }

  return context;
};

interface DemoVariantSelectorProviderProps {
  children: React.ReactNode;
  defaultVariant: string;
  defaultLanguage: string;
}

const VARIANT_STORAGE_KEY = 'preferredDemoVariant';
const LANGUAGE_STORAGE_KEY = 'preferredDemoLanguage';

export function DemoVariantSelectorProvider(props: DemoVariantSelectorProviderProps) {
  const { children, defaultVariant, defaultLanguage } = props;
  const [selectedVariant, setSelectedVariant] = React.useState(defaultVariant);
  const [selectedLanguage, setSelectedLanguage] = React.useState(defaultLanguage);

  const handleSelectedVariantChange = React.useCallback((value: string) => {
    setSelectedVariant(value);
    localStorage.setItem(VARIANT_STORAGE_KEY, value);
  }, []);

  const handleSelectedLanguageChange = React.useCallback((value: string) => {
    setSelectedLanguage(value);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, value);
  }, []);

  useEnhancedEffect(() => {
    const variantPreference = localStorage.getItem(VARIANT_STORAGE_KEY);
    const languagePreference = localStorage.getItem(LANGUAGE_STORAGE_KEY);

    if (variantPreference) {
      setSelectedVariant(variantPreference);
    }

    if (languagePreference) {
      setSelectedLanguage(languagePreference);
    }
  }, []);

  const contextValue = React.useMemo(
    () => ({
      selectedVariant,
      setSelectedVariant: handleSelectedVariantChange,
      selectedLanguage,
      setSelectedLanguage: handleSelectedLanguageChange,
    }),
    [selectedVariant, handleSelectedVariantChange, selectedLanguage, handleSelectedLanguageChange],
  );

  return (
    <DemoVariantSelectorContext.Provider value={contextValue}>
      {children}
    </DemoVariantSelectorContext.Provider>
  );
}
