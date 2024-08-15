'use client';

import * as React from 'react';
import { DemoContext, type DemoVariant } from 'docs-base/src/blocks/Demo';

const translations = {
  variants: {
    default: 'Default',
    system: 'MUI System',
    css: 'Plain CSS',
    tailwind: 'Tailwind CSS',
  } as Record<string, string>,
  languages: {
    ts: 'TypeScript',
    js: 'JavaScript',
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

  return (
    <div {...props}>
      {Object.keys(variantsMap).length > 1 && (
        <select value={selectedVariant.name} onChange={handleSelectChange}>
          {Object.keys(variantsMap).map((variantName) => (
            <option key={variantName} value={variantName}>
              {translations.variants[variantName]}
            </option>
          ))}
        </select>
      )}

      {variantsMap[selectedVariant.name].map((v) => (
        <button
          type="button"
          key={v.language}
          onClick={() => selectVariant(v.demo)}
          data-selected={v.language === selectedVariant.language}
        >
          {translations.languages[v.language]}
        </button>
      ))}
    </div>
  );
}
