'use client';
import * as React from 'react';
import * as Select from 'docs/src/components/Select';

const translations = {
  variants: {
    Default: 'Default',
    System: 'MUI System',
    Css: 'Plain CSS',
    CssModules: 'CSS Modules',
    Tailwind: 'Tailwind v4',
  } as Record<string, string>,
};

export interface DemoVariantSelectorProps extends React.HtmlHTMLAttributes<HTMLDivElement> {
  onVariantChange?: (variantName: string | null) => void;
  variants: string[];
  variant: string | null;
}

export function DemoVariantSelector({
  variants,
  variant: selectedVariant,
  onVariantChange,
}: DemoVariantSelectorProps) {
  return (
    <Select.Root
      items={translations.variants}
      value={selectedVariant}
      onValueChange={onVariantChange}
    >
      <Select.Trigger aria-label="Styling method" />
      <Select.Popup>
        {variants.map((variantName) => (
          <Select.Item key={variantName} value={variantName}>
            {translations.variants[variantName]}
          </Select.Item>
        ))}
      </Select.Popup>
    </Select.Root>
  );
}
