import { Context } from 'hono';
import { createSSEStream } from '../../utils/streamUtils';
import { emailWorkflow } from './emailWorkflow';
import { extractChatInput, createWorkflowInput } from './sharedUtils';

export async function handleChatStream(c: Context) {
	try {
		const body = await c.req.json();
		const inputData = extractChatInput(body);

		return createSSEStream(async (controller) => {
			const run = await emailWorkflow.createRunAsync();
			const result = await run.start(createWorkflowInput(inputData, controller));

			if (result.status !== 'success') {
				throw new Error(`Workflow failed: ${result.status}`);
			}
		});
	} catch (error) {
		console.error(error);
		return c.json(
			{ error: error instanceof Error ? error.message : 'Internal error' },
			500
		);
	}
}