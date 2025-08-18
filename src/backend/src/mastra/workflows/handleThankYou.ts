import { Context } from 'hono';
import { createSSEStream, streamJSONEvent } from '../../utils/streamUtils';

export async function handleThankYou(c: Context) {
	try {
		return createSSEStream(async (controller) => {
			// Simulate streaming response for thank you
			streamJSONEvent(controller, {
				type: 'action',
				content: "I'll help you create a thank you email...",
				stateKey: 'emailDraft',
				setterKey: 'draftReply',
				args: [
					'Dear Avery Chen,\n\nI wanted to take a moment to express my sincere gratitude for your assistance and support. Your assistance and support have been invaluable.\n\nThank you once again for your time and consideration.\n\nWith appreciation,\nJesse',
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
