import { stringifyLocale } from '@base-ui/utils/stringifyLocale';
import { stringifyAsLabel } from './resolveValueLabel';

const matcherCache = new Map<string, TextMatcher>();
const punctuationOrWhitespace = /[\p{P}\p{White_Space}]/u;
const allPunctuationOrWhitespace = /[\p{P}\p{White_Space}]/gu;

export function getFilter(options: GetFilterParameters = {}): Filter {
  return getTextMatcher(options).filter;
}

/** Shares collation rules between substring matching and whole-text equality. @internal */
export function getTextMatcher(options: GetFilterParameters = {}): TextMatcher {
  const { locale, ...restOptions } = options;
  const collatorOptions: Intl.CollatorOptions = {
    usage: 'search',
    sensitivity: 'base',
    ignorePunctuation: true,
    ...restOptions,
  };

  const cacheKey = `${stringifyLocale(locale)}|${JSON.stringify(collatorOptions)}`;
  const cachedMatcher = matcherCache.get(cacheKey);

  if (cachedMatcher) {
    return cachedMatcher;
  }

  const collator = new Intl.Collator(locale, collatorOptions);
  const { ignorePunctuation } = collator.resolvedOptions();

  function normalizeText(text: string) {
    // Normalize before taking substring lengths; equivalent text can have different code units.
    return text.normalize('NFC');
  }

  function matchesWithPunctuation(text: string, query: string, method: keyof Filter) {
    if (
      !ignorePunctuation ||
      (!punctuationOrWhitespace.test(text) && !punctuationOrWhitespace.test(query))
    ) {
      return false;
    }

    // These counts only locate candidate windows. Compare the original substrings because
    // punctuation and whitespace can affect locale-specific letter combinations.
    const queryLength = query.replace(allPunctuationOrWhitespace, '').length;
    const lengths = [0];
    for (const character of text) {
      const increment = punctuationOrWhitespace.test(character) ? 0 : 1;
      for (let i = 0; i < character.length; i += 1) {
        lengths.push(lengths[lengths.length - 1] + increment);
      }
    }

    let end = method === 'endsWith' ? text.length : 0;
    for (let start = 0; start <= text.length; start += 1) {
      while (end < text.length && lengths[end] - lengths[start] < queryLength) {
        end += 1;
      }

      for (
        let candidateEnd = end;
        candidateEnd <= text.length && lengths[candidateEnd] - lengths[start] === queryLength;
        candidateEnd += 1
      ) {
        if (collator.compare(text.slice(start, candidateEnd), query) === 0) {
          return true;
        }
        if (method === 'endsWith') {
          break;
        }
      }

      if (method === 'startsWith') {
        break;
      }
    }

    return false;
  }

  const filter: Filter = {
    contains<Item>(item: Item, query: string, itemToString?: (item: Item) => string) {
      const normalizedQuery = normalizeText(query);
      if (!normalizedQuery) {
        return true;
      }

      const itemString = normalizeText(stringifyAsLabel(item, itemToString));

      for (let i = 0; i <= itemString.length - normalizedQuery.length; i += 1) {
        if (
          collator.compare(itemString.slice(i, i + normalizedQuery.length), normalizedQuery) === 0
        ) {
          return true;
        }
      }

      return matchesWithPunctuation(itemString, normalizedQuery, 'contains');
    },
    startsWith<Item>(item: Item, query: string, itemToString?: (item: Item) => string) {
      const normalizedQuery = normalizeText(query);
      if (!normalizedQuery) {
        return true;
      }

      const itemString = normalizeText(stringifyAsLabel(item, itemToString));

      return (
        collator.compare(itemString.slice(0, normalizedQuery.length), normalizedQuery) === 0 ||
        matchesWithPunctuation(itemString, normalizedQuery, 'startsWith')
      );
    },
    endsWith<Item>(item: Item, query: string, itemToString?: (item: Item) => string) {
      const normalizedQuery = normalizeText(query);
      if (!normalizedQuery) {
        return true;
      }

      const itemString = normalizeText(stringifyAsLabel(item, itemToString));
      const queryLength = normalizedQuery.length;

      return (
        (itemString.length >= queryLength &&
          collator.compare(itemString.slice(itemString.length - queryLength), normalizedQuery) ===
            0) ||
        matchesWithPunctuation(itemString, normalizedQuery, 'endsWith')
      );
    },
  };

  const matcher: TextMatcher = {
    filter,
    equals(a, b) {
      return collator.compare(a, b) === 0;
    },
  };

  matcherCache.set(cacheKey, matcher);
  return matcher;
}

export interface TextMatcher {
  filter: Filter;
  equals: (a: string, b: string) => boolean;
}

export interface GetFilterParameters extends Intl.CollatorOptions {
  /**
   * The locale to use for string comparison.
   * Defaults to the user's runtime locale.
   */
  locale?: Intl.LocalesArgument | undefined;
}

export interface Filter {
  /** Returns whether the item matches the query anywhere. */
  contains: <Item>(item: Item, query: string, itemToString?: (item: Item) => string) => boolean;
  /** Returns whether the item starts with the query. */
  startsWith: <Item>(item: Item, query: string, itemToString?: (item: Item) => string) => boolean;
  /** Returns whether the item ends with the query. */
  endsWith: <Item>(item: Item, query: string, itemToString?: (item: Item) => string) => boolean;
}
