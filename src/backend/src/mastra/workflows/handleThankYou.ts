import { Context } from 'hono';
import { createSSEStream, streamJSONEvent } from '../../utils/streamUtils';
import { extractChatInput } from './sharedUtils';

export async function handleThankYou(c: Context) {
	try {
		const body = await c.req.json();
		const inputData = extractChatInput(body);

		return createSSEStream(async (controller) => {
			// Simulate streaming response for thank you
			streamJSONEvent(controller, {
				type: 'action',
				content: "I'll help you create a thank you email...",
				stateKey: 'emailDraft',
				setterKey: 'draftReply',
				args: [
					'Dear [Recipient Name],\n\nI wanted to take a moment to express my sincere gratitude for [specific reason]. Your assistance and support have been invaluable.\n\nThank you once again for your time and consideration.\n\nWith appreciation,\n[Your Name]',
					'Thank You',
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