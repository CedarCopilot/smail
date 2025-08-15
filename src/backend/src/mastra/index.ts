import { Mastra } from '@mastra/core/mastra';
import { LibSQLStore } from '@mastra/libsql';
import { chatWorkflow } from './workflows/chatWorkflow';
import { apiRoutes } from './apiRegistry';
import { productRoadmapAgent } from './agents/productRoadmapAgent';

// Create Mastra instance
export const mastra = new Mastra({
  agents: { productRoadmapAgent },
  workflows: { chatWorkflow },
  storage: new LibSQLStore({
    url: ':memory:',
  }),
  telemetry: {
    enabled: true,
  },
  server: {
    apiRoutes,
  },
});
