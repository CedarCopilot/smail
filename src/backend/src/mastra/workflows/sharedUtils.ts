import z from 'zod';

export const ChatInputSchema = z.object({
	prompt: z.string(),
	temperature: z.number().optional(),
	maxTokens: z.number().optional(),
	systemPrompt: z.string().optional(),
	// Memory linkage (optional)
	resourceId: z.string().optional(),
	threadId: z.string().optional(),
	streamController: z.any().optional(),
	// For structured output
	output: z.any().optional(),
	additionalContext: z.any().optional(),
	// If true, caller is the voice route and audio events should NOT be emitted here
	isVoice: z.boolean().optional(),
});

export function extractChatInput(body: unknown) {
	const {
		prompt,
		temperature,
		maxTokens,
		systemPrompt,
		resourceId,
		threadId,
		additionalContext,
	} = ChatInputSchema.parse(body);

	return {
		prompt,
		temperature,
		maxTokens,
		systemPrompt,
		resourceId,
		threadId,
		additionalContext,
	};
}

export function createWorkflowInput(
	inputData: ReturnType<typeof extractChatInput>,
	streamController?: ReadableStreamDefaultController<Uint8Array>,
	isVoice?: boolean
) {
	return {
		inputData: {
			...inputData,
			...(streamController && { streamController }),
			...(isVoice && { isVoice }),
		},
	};
}
