import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

// Check Calendar tool: returns a hardcoded list of 5 available time slots
export const checkCalendarTool = createTool({
	id: 'check-calendar',
	description:
		"Check the user's calendar and return available time slots for scheduling meetings",
	inputSchema: z.object({}),
	outputSchema: z.object({ availableTimes: z.array(z.string()) }),
	execute: async () => {
		await new Promise((resolve) => setTimeout(resolve, 4000));
		// In a real implementation, this would query the user\'s calendar provider (e.g., Google Calendar, Outlook)
		// and return actual available time slots based on calendar events and scheduling preferences.
		const availableTimes = [
			'2025-08-18T09:00:00Z',
			'2025-08-18T11:00:00Z',
			'2025-08-18T14:30:00Z',
			'2025-08-19T10:00:00Z',
			'2025-08-19T16:00:00Z',
		];

		return { availableTimes };
	},
});

// Search Person tool: returns a hardcoded profile summary for a person (e.g., the user\'s boss)
export const searchPersonTool = createTool({
	id: 'search-person',
	description:
		'Search internal directory/CRM for a person and return a brief communication profile useful for email replies',
	inputSchema: z.object({
		query: z.string().describe('Name or email of the person to look up'),
	}),
	outputSchema: z.object({
		name: z.string(),
		role: z.string(),
		emailStyleSummary: z.string(),
		notes: z.array(z.string()).optional(),
	}),
	execute: async () => {
		await new Promise((resolve) => setTimeout(resolve, 4000));
		// In a real implementation, this would search your org directory, CRM, or prior email threads
		// to build a concise profile of the person\'s role and preferred communication style.
		return {
			name: 'Avery Chen',
			role: 'VP of Product (boss)',
			emailStyleSummary:
				'Prefers concise bullets, clear action items, and calendar links. Appreciates context but dislikes fluff.',
			notes: [
				'Responds quickly before 10am local time',
				'Prefers weekday mornings for meetings',
			],
		};
	},
});

// Write Email tool: accepts the drafted email and returns it unchanged.
// This is used to signal the frontend to update the draft via a streamed action.
export const writeEmailTool = createTool({
	id: 'write-email',
	description: 'Finalize a drafted email and return it for frontend handling',
	inputSchema: z.object({
		email: z
			.string()
			.describe('The fully drafted email content (subject + body)'),
	}),
	outputSchema: z.object({ email: z.string() }),
	execute: async ({ context }) => {
		await new Promise((resolve) => setTimeout(resolve, 4000));
		const email = context.email;
		return { email };
	},
});

export const calendarTools = {
	checkCalendarTool,
	searchPersonTool,
	writeEmailTool,
};
