// Inline JSDoc preambles on the .d.ts files (composition/anatomy + patch-
// specific placement rules) + an AGENTS.md (and CLAUDE.md shim) telling the
// agent the types are the source of truth. No markdown docs overlay.
import { defineExperiment } from '../lib/defineExperiment.js';

export default defineExperiment({ agent: 'claude-code', mechanism: 'inline-dts-agents-md' });
