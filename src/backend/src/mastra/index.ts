import { Mastra } from '@mastra/core/mastra';
import { LibSQLStore } from '@mastra/libsql';
import { emailWorkflow } from './workflows/emailWorkflow';
import { apiRoutes } from './apiRegistry';
import { emailAgent } from './agents/emailAgent';
import { rewriteAgent } from './agents/rewriteAgent';

// Create Mastra instance
export const mastra = new Mastra({
	agents: { emailAgent, rewriteAgent },
	workflows: { emailWorkflow },
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
