import { NumberFormatOptions } from '../types';

// Safe pre-defined patterns for common locales to prevent ReDoS
const SAFE_GROUPING_PATTERNS: Record<string, RegExp> = {
  'en-US': /,/g,
  'en-GB': /,/g,
  'de-DE': /\./g,
  'fr-FR': /\s/g,
  'es-ES': /\./g,
  'it-IT': /\./g,
  'pt-BR': /\./g,
  'ja-JP': /,/g,
  'ko-KR': /,/g,
  'zh-CN': /,/g,
  'ru-RU': /\s/g,
  'ar-SA': /,/g,
  'hi-IN': /,/g,
};

// Fallback safe pattern
const DEFAULT_GROUPING_PATTERN = /,/g;

function getSafeGroupingPattern(locale: string): RegExp {
  // Use pre-defined safe pattern if available
  if (SAFE_GROUPING_PATTERNS[locale]) {
    return SAFE_GROUPING_PATTERNS[locale];
  }
  
  // For unknown locales, try to determine the grouping separator safely
  try {
    const formatter = new Intl.NumberFormat(locale);
    const formatted = formatter.format(1234567);
    
    // Extract grouping separator by comparing with non-grouped number
    const nonGrouped = formatter.format(1234567).replace(/\D/g, '');
    if (nonGrouped === '1234567') {
      // Find the grouping character by process of elimination
      const digits = '1234567';
      for (let i = 0; i < formatted.length; i++) {
        const char = formatted[i];
        if (!digits.includes(char)) {
          // Validate that this is a safe grouping character
          if (/^[,.\s\u00A0\u2009\u202F]$/.test(char)) {
            return new RegExp(char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
          }
        }
      }
    }
  } catch (error) {
    // If locale is invalid or causes error, use default
    console.warn(`Invalid locale "${locale}", using default grouping pattern`);
  }
  
  return DEFAULT_GROUPING_PATTERN;
}

export function parseNumber(
  value: string,
  locale: string = 'en-US',
  options: NumberFormatOptions = {}
): number | null {
  if (!value || typeof value !== 'string') {
    return null;
  }

  // Validate locale input to prevent injection
  if (typeof locale !== 'string' || !/^[a-zA-Z]{2}(-[a-zA-Z]{2})?$/.test(locale)) {
    locale = 'en-US';
  }

  try {
    // Use safe grouping pattern instead of dynamic regex construction
    const groupingPattern = getSafeGroupingPattern(locale);
    
    // Remove grouping separators safely
    let cleanValue = value.replace(groupingPattern, '');
    
    // Handle decimal separator
    const formatter = new Intl.NumberFormat(locale);
    const decimalSeparator = formatter.format(1.1).charAt(1);
    
    // Replace locale-specific decimal separator with standard dot
    if (decimalSeparator !== '.') {
      cleanValue = cleanValue.replace(decimalSeparator, '.');
    }
    
    // Validate the cleaned value is a valid number format
    if (!/^-?\d*\.?\d*$/.test(cleanValue)) {
      return null;
    }
    
    const parsed = parseFloat(cleanValue);
    return isNaN(parsed) ? null : parsed;
  } catch (error) {
    console.error('Error parsing number:', error);
    return null;
  }
}

export function formatNumber(
  value: number,
  locale: string = 'en-US',
  options: NumberFormatOptions = {}
): string {
  if (typeof value !== 'number' || isNaN(value)) {
    return '';
  }

  // Validate locale input
  if (typeof locale !== 'string' || !/^[a-zA-Z]{2}(-[a-zA-Z]{2})?$/.test(locale)) {
    locale = 'en-US';
  }

  try {
    const formatter = new Intl.NumberFormat(locale, options);
    return formatter.format(value);
  } catch (error) {
    console.error('Error formatting number:', error);
    // Fallback to default locale
    return new Intl.NumberFormat('en-US', options).format(value);
  }
}
