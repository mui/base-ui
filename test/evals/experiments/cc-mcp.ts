import { defineExperiment } from '../lib/defineExperiment.js';

// Knowledge via an MCP server (@mui/mcp) configured through .mcp.json.
export default defineExperiment({ agent: 'claude-code', mechanism: 'mcp' });
