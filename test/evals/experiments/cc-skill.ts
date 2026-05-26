import { defineExperiment } from '../lib/defineExperiment.js';

// Knowledge via a custom Claude Code skill (.claude/skills/base-ui).
export default defineExperiment({ agent: 'claude-code', mechanism: 'skill' });
