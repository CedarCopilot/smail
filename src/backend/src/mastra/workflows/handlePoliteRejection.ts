import { Context } from 'hono';
import { createSSEStream } from '../../utils/streamUtils';
import { streamJSONEvent } from './handleCustomStream';

export async function handlePoliteRejection(c: Context) {
	try {
		return createSSEStream(async (controller) => {
			// Simulate streaming response for polite rejection
			streamJSONEvent(controller, {
				type: 'action',
				content: "I'll help you craft a polite rejection email...",
				stateKey: 'emailDraft',
				setterKey: 'draftReply',
				args: [
					"Dear Avery Chen,\n\nThank you for reaching out and for your interest. After careful consideration, I regret to inform you that I won't be able to proceed with this opportunity at this time.\n\nI appreciate your understanding and wish you the best with your endeavors.\n\nBest regards,\nJesse",
					'Re: Your Request',
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
