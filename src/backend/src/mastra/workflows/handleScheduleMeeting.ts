import { Context } from 'hono';
import { createSSEStream } from '../../utils/streamUtils';
import { streamJSONEvent } from './handleCustomStream';

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
					`Hi Avery,

Thank you for reaching out. I'm glad to hear about the progress on the frontend components and I'm eager to discuss the user authentication flow and data persistence.

Here are a few time slots I have available this week:
- Tuesday, August 18th at 9:00 AM
- Tuesday, August 18th at 11:00 AM
- Wednesday, August 19th at 10:00 AM

Please let me know if any of these times work for you, or feel free to suggest another time that suits your schedule better. I'm open to either a video call or an in-person meeting, as you prefer.

Looking forward to our discussion.

Best regards,

Jesse Li`,
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
