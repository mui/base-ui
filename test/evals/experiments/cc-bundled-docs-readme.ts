// Bundled docs in node_modules + a pointer in `@base-ui/react/README.md`.
import { defineExperiment } from '../lib/defineExperiment.js';

export default defineExperiment({ agent: 'claude-code', mechanism: 'bundled-docs-readme' });
