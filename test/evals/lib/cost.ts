/**
 * `onRunComplete` hook that derives cost and web-usage metrics from the raw
 * agent transcript and attaches them to `result.metadata`.
 *
 * The framework records run duration but not token usage or cost. The raw
 * Claude Code transcript (JSONL) carries per-message `usage`, so we sum it
 * here and price it via `pricing.ts`. We also count `WebFetch`/`WebSearch`
 * tool calls — a behavioural signal for how much the agent leaned on the web
 * rather than the knowledge mechanism under test.
 */
import type { EvalRunData, RunCompleteHook } from '@vercel/agent-eval';
import { pricingForModel } from './pricing.js';

interface TokenTotals {
  input: number;
  output: number;
  cacheWrite: number;
  cacheRead: number;
}

interface WebCall {
  tool: string;
  url?: string;
}

function analyzeTranscript(transcript: string | undefined): {
  totals: TokenTotals;
  webCalls: WebCall[];
  model: string;
} {
  const totals: TokenTotals = { input: 0, output: 0, cacheWrite: 0, cacheRead: 0 };
  const webCalls: WebCall[] = [];
  let model = '';

  if (!transcript) {
    return { totals, webCalls, model };
  }

  for (const line of transcript.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }

    let entry: Record<string, any>;
    try {
      entry = JSON.parse(trimmed);
    } catch {
      continue;
    }

    // Claude Code wraps the payload: { type: 'assistant', message: { ... } }.
    const message = (entry.message ?? entry) as Record<string, any>;
    const isAssistant = entry.type === 'assistant' || message?.role === 'assistant';
    if (!isAssistant) {
      continue;
    }

    const usage = message?.usage as Record<string, number> | undefined;
    if (usage) {
      totals.input += usage.input_tokens ?? 0;
      totals.output += usage.output_tokens ?? 0;
      totals.cacheWrite += usage.cache_creation_input_tokens ?? 0;
      totals.cacheRead += usage.cache_read_input_tokens ?? 0;
    }

    if (typeof message?.model === 'string') {
      model = message.model;
    }

    const content = Array.isArray(message?.content) ? message.content : [];
    for (const block of content) {
      if (block?.type === 'tool_use' && (block.name === 'WebFetch' || block.name === 'WebSearch')) {
        webCalls.push({ tool: block.name, url: block.input?.url });
      }
    }
  }

  return { totals, webCalls, model };
}

export const withCostMetrics: RunCompleteHook = ({ runData, config }): EvalRunData => {
  const { totals, webCalls, model } = analyzeTranscript(runData.transcript);
  const resolvedModel = model || (typeof config.model === 'string' ? config.model : 'unknown');
  const pricing = pricingForModel(resolvedModel);

  const costUSD =
    (totals.input * pricing.inputPerMTok +
      totals.output * pricing.outputPerMTok +
      totals.cacheWrite * pricing.cacheWritePerMTok +
      totals.cacheRead * pricing.cacheReadPerMTok) /
    1_000_000;

  return {
    ...runData,
    result: {
      ...runData.result,
      metadata: {
        ...runData.result.metadata,
        tokens: {
          ...totals,
          total: totals.input + totals.output + totals.cacheWrite + totals.cacheRead,
        },
        costUSD: Number(costUSD.toFixed(4)),
        pricedAs: resolvedModel,
        webFetches: { count: webCalls.length, calls: webCalls },
      },
    },
  };
};
