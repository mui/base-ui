// Knowledge via docs shipped inside the @base-ui/react npm package (PR #4761).
import { defineExperiment } from '../lib/defineExperiment.js';

export default defineExperiment({ agent: 'claude-code', mechanism: 'bundled-docs' });
