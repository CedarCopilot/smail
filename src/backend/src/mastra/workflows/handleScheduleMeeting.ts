import { Context } from 'hono';
import { createSSEStream, streamJSONEvent } from '../../utils/streamUtils';

export async function handleScheduleMeeting(c: Context) {
	try {
		return createSSEStream(async (controller) => {
			// Simulate streaming response for schedule meeting
			streamJSONEvent(controller, {
				type: 'action',
				content:
					"I'll help you schedule a meeting. Let me draft a professional email...",
				stateKey: 'emailDraft',
				setterKey: 'draftReply',
				args: [
					'Dear Avery Chen,\n\nI hope this email finds you well. I would like to schedule a meeting to discuss these security issues. Would you be available next week for a 30-minute conversation?\n\nPlease let me know what times work best for your schedule.\n\nBest regards,\nJesse',
					"Meeting Request - Let's Schedule a Time",
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
