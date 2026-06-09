// Bundled docs in node_modules + an AGENTS.md (and CLAUDE.md shim) that
// includes a "Bundled docs" section pointing at the docs/ directory.
import { defineExperiment } from '../lib/defineExperiment.js';

export default defineExperiment({ agent: 'claude-code', mechanism: 'bundled-docs-agents-md' });
