// Bundled docs in node_modules + a Claude Code skill that includes a
// "Bundled docs" section pointing at the docs/ directory.
import { defineExperiment } from '../lib/defineExperiment.js';

export default defineExperiment({ agent: 'claude-code', mechanism: 'bundled-docs-skill' });
