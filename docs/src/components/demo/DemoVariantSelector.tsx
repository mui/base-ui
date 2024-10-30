'use client';
import * as React from 'react';
import { type DemoVariant } from 'docs/src/blocks/Demo';
import { useDemoContext } from 'docs/src/blocks/Demo/DemoContext';
import { useDemoVariantSelectorContext } from './DemoVariantSelectorProvider';

const translations = {
  variants: {
    default: 'Default',
    system: 'MUI System',
    css: 'Plain CSS',
    'css-modules': 'CSS Modules',
    tailwind: 'Tailwind CSS',
  } as Record<string, string>,
  languages: {
    ts: 'TS',
    js: 'JS',
  },
};

export interface DemoVariantSelectorProps extends React.HtmlHTMLAttributes<HTMLDivElement> {
  showLanguageSelector?: boolean;
}

export function DemoVariantSelector({ showLanguageSelector, ...props }: DemoVariantSelectorProps) {
  /*
    The "local" variant is the one that is selected in the current demo.
    The "global" one is the one that comes from the DemoVariantSelectorContext.

    The global variant is just a preference, it doesn't mean that the demo has that variant.
    If the demo doesn't have the global variant, it will fallback to the first one that it has (but it won't set the global setting to it).
  */

  const {
    variants,
    setSelectedVariant: setLocalVariant,
    selectedVariant: selectedLocalVariant,
  } = useDemoContext();

  const {
    selectedLanguage: selectedGlobalLanguageId,
    setSelectedLanguage: setGlobalLanguageId,
    selectedVariant: selectedGlobalVariantId,
    setSelectedVariant: setGlobalVariantId,
  } = useDemoVariantSelectorContext();

  const variantsMap = React.useMemo(() => getAvailableVariants(variants), [variants]);

  // Whenever user changes a setting, we update the global preference and not set the local one directly.
  const handleVariantChange = React.useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      setGlobalVariantId(event.target.value);
    },
    [setGlobalVariantId],
  );

  // As above.
  const handleLanguageChange = React.useCallback(
    (language: { value: string; label: string; demo: DemoVariant }) => {
      setGlobalLanguageId(language.value);
    },
    [setGlobalLanguageId],
  );

  // When the global variant changes, we update the local one
  React.useEffect(() => {
    if (variantsMap[selectedGlobalVariantId]) {
      const variantInPreferredLanguage = variantsMap[selectedGlobalVariantId].find(
        (v) => v.language === selectedGlobalLanguageId,
      );
      if (variantInPreferredLanguage) {
        setLocalVariant(variantInPreferredLanguage.demo);
      } else {
        setLocalVariant(variantsMap[selectedGlobalVariantId][0].demo);
      }
    } else {
      // The global variant is not available in the current demo.
      // We keep using the already selected variant.
      const currentVariant = variantsMap[selectedLocalVariant.name];

      // But perhaps we can match the globally selected language?
      const currentVariantInPreferredLanguage = currentVariant.find(
        (v) => v.language === selectedGlobalLanguageId,
      );

      if (currentVariantInPreferredLanguage) {
        setLocalVariant(currentVariantInPreferredLanguage.demo);
      }

      // If we can't, we do not change anything.
    }
  }, [
    selectedGlobalLanguageId,
    selectedGlobalVariantId,
    setLocalVariant,
    variantsMap,
    selectedLocalVariant.name,
  ]);

  const currentVariantLanguages = React.useMemo(
    () =>
      variantsMap[selectedLocalVariant.name].map((v) => ({
        value: v.language,
        label: translations.languages[v.language],
        demo: v.demo,
      })),
    [selectedLocalVariant.name, variantsMap],
  );

  const renderVariantSelector = Object.keys(variantsMap).length > 1;
  const renderLanguageSelector = currentVariantLanguages.length > 1 && showLanguageSelector;

  return (
    <div {...props}>
      {renderVariantSelector && (
        <select
          className="DemoSelect"
          value={selectedLocalVariant.name}
          onChange={handleVariantChange}
          aria-label="Styles"
        >
          {Object.keys(variantsMap).map((variantName) => (
            <option key={variantName} value={variantName}>
              {translations.variants[variantName]}
            </option>
          ))}
        </select>
      )}

      {renderLanguageSelector && (
        <select
          className="DemoSelect"
          value={selectedLocalVariant.language}
          onChange={(event) => {
            const language = currentVariantLanguages.find(
              ({ value }) => value === event.target.value,
            );
            if (language) {
              handleLanguageChange(language);
            }
          }}
          aria-label="Language"
        >
          {currentVariantLanguages.map((language) => (
            <option key={language.value} value={language.value}>
              {language.label}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

function getAvailableVariants(demoVariants: DemoVariant[]) {
  const variantsMap: Record<string, { language: 'js' | 'ts'; demo: DemoVariant }[]> = {};
  for (const variant of demoVariants) {
    if (!variantsMap[variant.name]) {
      variantsMap[variant.name] = [];
    }

    variantsMap[variant.name].push({ language: variant.language, demo: variant });
  }

  return variantsMap;
}
