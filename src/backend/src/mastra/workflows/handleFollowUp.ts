import { Context } from 'hono';
import { createSSEStream, streamJSONEvent } from '../../utils/streamUtils';
import { extractChatInput } from './sharedUtils';

export async function handleFollowUp(c: Context) {
	try {
		const body = await c.req.json();
		const inputData = extractChatInput(body);

		return createSSEStream(async (controller) => {
			// Simulate streaming response for follow up
			streamJSONEvent(controller, {
				type: 'action',
				content: "I'll help you create a follow-up email...",
				stateKey: 'emailDraft',
				setterKey: 'draftReply',
				args: [
					"Dear [Recipient Name],\n\nI hope you're doing well. I wanted to follow up on our previous conversation regarding [topic].\n\nI understand you may be busy, but I wanted to check if you had a chance to consider my previous message. Please let me know if you need any additional information.\n\nLooking forward to hearing from you.\n\nBest regards,\n[Your Name]",
					'Following Up - [Original Subject]',
				],
			});
			await new Promise((resolve) => setTimeout(resolve, 100));
		});
	} catch (error) {
		console.error(error);
		return c.json(
			{ error: error instanceof Error ? error.message : 'Internal error' },
			500
		);
	}
}