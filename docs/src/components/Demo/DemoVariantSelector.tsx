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
  onVariantChange?: () => void;
  showLanguageSelector?: boolean;
  variants: string[];
  selectedVariant: string | null;
  selectVariant: React.Dispatch<React.SetStateAction<string | null>>;
  availableTransforms: string[];
  selectedTransform: string | null | undefined;
  selectTransform: (transformName: string | null) => void;
}

export function DemoVariantSelector({
  variants,
  selectedVariant,
  selectVariant,
  availableTransforms,
  selectedTransform,
  selectTransform,
  showLanguageSelector,
  onVariantChange,
  ...props
}: DemoVariantSelectorProps) {
  const hasJsTransform = availableTransforms.includes('js');
  const handleLanguageChange = React.useCallback(
    (value: string | null) => {
      selectTransform(value === 'ts' ? null : value);
    },
    [selectTransform],
  );

  const handleVariantChange = React.useCallback(
    (value: string | null) => {
      selectVariant(value);
      onVariantChange?.();
    },
    [selectVariant, onVariantChange],
  );

  return (
    <div {...props}>
      {hasJsTransform && (
        <Select.Root
          items={[
            { value: 'ts', label: 'TS' },
            { value: 'js', label: 'JS' },
          ]}
          value={selectedTransform || 'ts'}
          onValueChange={handleLanguageChange}
        >
          <Select.Trigger />
          <Select.Popup>
            <Select.Item value="ts">TS</Select.Item>
            <Select.Item value="js">JS</Select.Item>
          </Select.Popup>
        </Select.Root>
      )}

      {variants.length > 1 && (
        <Select.Root
          items={translations.variants}
          value={selectedVariant}
          onValueChange={handleVariantChange}
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
      )}
    </div>
  );
}
