import { Context } from 'hono';
import { emailWorkflow } from './emailWorkflow';
import { extractChatInput, createWorkflowInput } from './sharedUtils';
import { ChatOutput } from '../apiRegistry';

export async function handleChat(c: Context) {
	try {
		const body = await c.req.json();
		const inputData = extractChatInput(body);

		const run = await emailWorkflow.createRunAsync();
		const result = await run.start(createWorkflowInput(inputData));

		if (result.status === 'success') {
			return c.json<ChatOutput>(result.result);
		}
	} catch (error) {
		console.error(error);
		return c.json(
			{ error: error instanceof Error ? error.message : 'Internal error' },
			500
		);
	}
}
