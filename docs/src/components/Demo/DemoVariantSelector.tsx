'use client';
import * as React from 'react';
import { type DemoVariant } from 'docs/src/blocks/Demo';
import { useDemoContext } from 'docs/src/blocks/Demo/DemoContext';
import * as Select from 'docs/src/components/Select';
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
  onVariantChange?: () => void;
  showLanguageSelector?: boolean;
}

export function DemoVariantSelector({
  showLanguageSelector,
  onVariantChange,
  ...props
}: DemoVariantSelectorProps) {
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
    (value: unknown) => {
      onVariantChange?.();
      setGlobalVariantId(value as string);
    },
    [onVariantChange, setGlobalVariantId],
  );

  const currentVariantLanguages = React.useMemo(
    () =>
      variantsMap[selectedLocalVariant.name].map((v) => ({
        value: v.language,
        label: translations.languages[v.language],
        demo: v.demo,
      })),
    [selectedLocalVariant.name, variantsMap],
  );

  // As above.
  const handleLanguageChange = React.useCallback(
    (value: string) => {
      onVariantChange?.();
      const language = currentVariantLanguages.find((item) => item.value === value);
      if (language) {
        setGlobalLanguageId(language.value);
      }
    },
    [currentVariantLanguages, setGlobalLanguageId, onVariantChange],
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

  const renderVariantSelector = Object.keys(variantsMap).length > 1;
  const renderLanguageSelector = currentVariantLanguages.length > 1 && showLanguageSelector;

  return (
    <div {...props}>
      {renderLanguageSelector && (
        <Select.Root value={selectedLocalVariant.language} onValueChange={handleLanguageChange}>
          <Select.Trigger
            initial={
              currentVariantLanguages.find((item) => item.value === selectedLocalVariant.language)
                ?.label ?? ''
            }
          />
          <Select.Popup>
            {currentVariantLanguages.map((language) => (
              <Select.Item key={language.value} value={language.value}>
                {language.label}
              </Select.Item>
            ))}
          </Select.Popup>
        </Select.Root>
      )}

      {renderVariantSelector && (
        <Select.Root value={selectedLocalVariant.name} onValueChange={handleVariantChange}>
          <Select.Trigger
            initial={translations.variants[selectedLocalVariant.name]}
            aria-label="Styling method"
          />
          <Select.Popup>
            {Object.keys(variantsMap).map((variantName) => (
              <Select.Item key={variantName} value={variantName}>
                {translations.variants[variantName]}
              </Select.Item>
            ))}
          </Select.Popup>
        </Select.Root>
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
