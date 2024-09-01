'use client';

import * as React from 'react';
import { type DemoVariant } from 'docs-base/src/blocks/Demo';
import { useDemoContext } from 'docs-base/src/blocks/Demo/DemoContext';
import { ToggleButtonGroup } from 'docs-base/src/design-system/ToggleButtonGroup';
import classes from './DemoVariantSelector.module.css';
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

export interface DemoVariantSelectorProps extends React.HtmlHTMLAttributes<HTMLDivElement> {
  showLanguageSelector?: boolean;
}

export function DemoVariantSelector(props: DemoVariantSelectorProps) {
  const { showLanguageSelector = true, ...other } = props;

  const {
    variants,
    selectVariant: setLocalVariant,
    selectedVariant: selectedLocalVariant,
  } = useDemoContext();

  const {
    selectedLanguage: selectedGlobalLanguageId,
    setSelectedLanguage: setGlobalLanguageId,
    selectedVariant: selectedGlobalVariantId,
    setSelectedVariant: setGlobalVariantId,
  } = useDemoVariantSelectorContext();

  const variantsMap = React.useMemo(() => getAvailableVariants(variants), [variants]);

  const handleVariantChange = React.useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      setGlobalVariantId(event.target.value);
    },
    [setGlobalVariantId],
  );

  const handleLanguageChange = React.useCallback(
    (language: { value: string; label: string; demo: DemoVariant }) => {
      setGlobalLanguageId(language.value);
    },
    [setGlobalLanguageId],
  );

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
      const firstVariant = variantsMap[Object.keys(variantsMap)[0]];
      const firstVariantInPreferredLanguage = firstVariant.find(
        (v) => v.language === selectedGlobalLanguageId,
      );

      if (firstVariantInPreferredLanguage) {
        setLocalVariant(firstVariantInPreferredLanguage.demo);
      } else {
        setLocalVariant(firstVariant[0].demo);
      }
    }
  }, [selectedGlobalLanguageId, selectedGlobalVariantId, setLocalVariant, variantsMap]);

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
  const renderSeparator = renderVariantSelector && renderLanguageSelector;

  return (
    <div {...other} className={classes.root}>
      {renderVariantSelector && (
        <select
          value={selectedLocalVariant.name}
          onChange={handleVariantChange}
          className={classes.variantSelector}
          aria-label="Styling solution selector"
        >
          {Object.keys(variantsMap).map((variantName) => (
            <option key={variantName} value={variantName}>
              {translations.variants[variantName]}
            </option>
          ))}
        </select>
      )}

      {renderSeparator && <span role="separator" className={classes.separator} />}

      {renderLanguageSelector && (
        <ToggleButtonGroup
          className={classes.languages}
          options={currentVariantLanguages}
          value={selectedLocalVariant.language}
          onValueChange={handleLanguageChange}
          aria-label="Language selector"
        />
      )}
    </div>
  );
}
