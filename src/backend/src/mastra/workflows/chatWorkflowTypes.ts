import { z } from 'zod';

// Union of all action responses
export const ActionResponseSchema = z.object({
	type: z.literal('action'),
	stateKey: z.string(),
	setterKey: z.string(),
	args: z.array(z.any()),
});

// Final agent response shape – either a plain chat message (content only)
// or a chat message accompanied by an action.
export const ExecuteFunctionResponseSchema = z.object({
	content: z.string(),
	action: ActionResponseSchema.optional(),
});

export type ActionResponse = z.infer<typeof ActionResponseSchema>;
