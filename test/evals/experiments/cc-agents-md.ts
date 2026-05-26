import { defineExperiment } from '../lib/defineExperiment.js';

// Knowledge via an AGENTS.md (+ CLAUDE.md) injected into the workspace.
export default defineExperiment({ agent: 'claude-code', mechanism: 'agents-md' });
