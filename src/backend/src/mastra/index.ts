import { Mastra } from '@mastra/core/mastra';
import { LibSQLStore } from '@mastra/libsql';
import { emailWorkflow } from './workflows/emailWorkflow';
import { apiRoutes } from './apiRegistry';
import { emailAgent } from './agents/emailAgent';

// Create Mastra instance
export const mastra = new Mastra({
	agents: { emailAgent },
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
