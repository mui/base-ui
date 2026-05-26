/**
 * Approximate USD list prices for deriving run cost from transcript token usage.
 *
 * These are list prices per million tokens and are used only for relative
 * comparison between experiments — they are NOT billed cost. Update as needed.
 */

export interface ModelPricing {
  inputPerMTok: number;
  outputPerMTok: number;
  cacheWritePerMTok: number;
  cacheReadPerMTok: number;
}

/** Keyed by a coarse model family; resolved by substring match. */
const TABLE: Record<'opus' | 'sonnet' | 'haiku', ModelPricing> = {
  opus: { inputPerMTok: 15, outputPerMTok: 75, cacheWritePerMTok: 18.75, cacheReadPerMTok: 1.5 },
  sonnet: { inputPerMTok: 3, outputPerMTok: 15, cacheWritePerMTok: 3.75, cacheReadPerMTok: 0.3 },
  haiku: { inputPerMTok: 1, outputPerMTok: 5, cacheWritePerMTok: 1.25, cacheReadPerMTok: 0.1 },
};

/**
 * Resolve pricing for a model identifier (e.g. `opus`, `claude-opus-4-7`).
 * Falls back to Sonnet pricing for unrecognized models.
 */
export function pricingForModel(model: string): ModelPricing {
  const normalized = model.toLowerCase();
  if (normalized.includes('opus')) {
    return TABLE.opus;
  }
  if (normalized.includes('haiku')) {
    return TABLE.haiku;
  }
  if (normalized.includes('sonnet')) {
    return TABLE.sonnet;
  }
  return TABLE.sonnet;
}
