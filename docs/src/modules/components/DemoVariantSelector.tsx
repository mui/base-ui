'use client';

import * as React from 'react';
import { DemoContext, type DemoVariant } from 'docs-base/src/blocks/Demo';
import { ToggleButtonGroup } from 'docs-base/src/design-system/ToggleButtonGroup';
import classes from './DemoVariantSelector.module.css';

const translations = {
  variants: {
    default: 'Default',
    system: 'MUI System',
    css: 'Plain CSS',
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

export function DemoVariantSelector(props: React.HtmlHTMLAttributes<HTMLDivElement>) {
  const demoContext = React.useContext(DemoContext);
  if (!demoContext) {
    throw new Error('Missing DemoContext');
  }

  const {
    variants,
    selectVariant,
    state: { selectedVariant },
  } = demoContext;

  const variantsMap = React.useMemo(() => getAvailableVariants(variants), [variants]);

  const handleSelectChange = React.useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      selectVariant(variantsMap[event.target.value][0].demo);
    },
    [selectVariant, variantsMap],
  );

  const variantLanguages = React.useMemo(
    () =>
      variantsMap[selectedVariant.name].map((v) => ({
        value: v.language,
        label: translations.languages[v.language],
        demo: v.demo,
      })),
    [selectedVariant.name, variantsMap],
  );

  const renderVariantSelector = Object.keys(variantsMap).length > 1;
  const renderLanguageSelector = variantLanguages.length > 1;
  const renderSeparator = renderVariantSelector && renderLanguageSelector;

  return (
    <div {...props} className={classes.root}>
      {renderVariantSelector && (
        <select
          value={selectedVariant.name}
          onChange={handleSelectChange}
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

      {renderVariantSelector && (
        <ToggleButtonGroup
          className={classes.languages}
          options={variantLanguages}
          value={selectedVariant.language}
          onValueChange={(v) => selectVariant(v.demo)}
          aria-label="Language selector"
        />
      )}
    </div>
  );
}
