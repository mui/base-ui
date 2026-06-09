import { defineExperiment } from '../lib/defineExperiment.js';

// Control arm: Claude Code with no injected Base UI knowledge.
export default defineExperiment({ agent: 'claude-code', mechanism: 'baseline' });
