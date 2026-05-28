// Bundled docs in node_modules + a `@packageDocumentation` JSDoc preamble
// on the package's main `index.d.ts`.
import { defineExperiment } from '../lib/defineExperiment.js';

export default defineExperiment({ agent: 'claude-code', mechanism: 'bundled-docs-dts' });
