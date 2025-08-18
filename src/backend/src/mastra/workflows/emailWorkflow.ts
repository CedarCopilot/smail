// ---------------------------------------------
// Workflows are a Mastra primitive to orchestrate agents and complex sequences of tasks
// Docs: https://mastra.ai/en/docs/workflows/overview
// ---------------------------------------------

import { createWorkflow, createStep } from '@mastra/core/workflows';
import { z } from 'zod';
import { emailAgent } from '../agents/emailAgent';
import { streamJSONEvent } from '../../utils/streamUtils';
import {
	handleTextDelta,
	handleToolCall,
	handleToolResult,
} from './handleCustomStream';
import { createSpeakFunction, handleVoiceOutput } from './voiceUtils';
import { ChatOutput } from '../apiRegistry';
import { ActionResponseSchema } from './chatWorkflowTypes';

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

export const ChatOutputSchema = z.object({
	content: z.string(),
	object: ActionResponseSchema.optional(),
	usage: z.any().optional(),
});

// Prepare context and build message array for the agent
const prepareAgentContext = createStep({
	id: 'prepareAgentContext',
	description:
		'Extract additional context and build LLM message array for agent',
	inputSchema: ChatInputSchema,
	outputSchema: ChatInputSchema.extend({
		messages: z.array(
			z.object({
				role: z.enum(['system', 'user', 'assistant']),
				content: z.string(),
			})
		),
	}),
	execute: async ({ inputData }) => {
		// Extract and stringify the `value` object from additionalContext
		const userPrompt = inputData.prompt;
		const valueObj =
			inputData.additionalContext?.currentEmailBeingViewed?.[0]?.data?.value;
		const additionalContext = valueObj ? JSON.stringify(valueObj) : undefined;

		// Build message array with user prompt and optional email context
		const messages = [
			{ role: 'user' as const, content: userPrompt },
			...(additionalContext
				? [
						{
							role: 'user' as const,
							content: `Current email user is looking at: ${additionalContext}`,
						},
					]
				: []),
		];

		return {
			...inputData,
			messages,
			additionalContext,
		};
	},
});

// Removed placeholder nested streaming emitter; rely on agent-provided nested streaming

// Invoke the email agent with nested streaming support
const callAgent = createStep({
	id: 'callAgent',
	description: 'Invoke the email agent with options',
	inputSchema: prepareAgentContext.outputSchema,
	outputSchema: ChatOutputSchema,
	execute: async ({ inputData }) => {
		const {
			messages,
			temperature,
			maxTokens,
			streamController,
			systemPrompt,
			resourceId,
			threadId,
			isVoice,
		} = inputData;

		// Streaming path: forward nested streaming chunks and synthetic progress updates
		if (streamController) {
			// Initial progress update: Thinking...
			streamJSONEvent(streamController, {
				type: 'progress_update',
				state: 'in_progress',
				text: 'Thinking...',
			});

			// Use the new streamVNext method to get a stream of all Mastra events
			const stream = emailAgent.streamVNext(messages, {
				...(systemPrompt ? ({ instructions: systemPrompt } as const) : {}),
				temperature,
				maxTokens,
				...(resourceId &&
					threadId && { memory: { resource: resourceId, thread: threadId } }),
			});
			const speakFn = createSpeakFunction();
			const pendingText = { value: '' };

			// With Cedar, you can handle any event in a custom way to create a custom protocol of communication between your frontend and your backend
			for await (const chunk of stream) {
				if (!chunk || !chunk.type) continue;
				switch (chunk.type) {
					case 'text-delta':
						handleTextDelta(chunk, !!isVoice, pendingText, streamController);
						break;
					case 'tool-call':
						await handleToolCall(
							chunk,
							!!isVoice,
							pendingText,
							streamController,
							speakFn
						);
						break;
					case 'tool-result':
						await handleToolResult(
							chunk,
							!!isVoice,
							pendingText,
							streamController,
							speakFn
						);
						break;
				}
			}

			const finalResult = stream.text;

			if (isVoice && pendingText.value) {
				await handleVoiceOutput(streamController, pendingText.value);
			}

			const finalMessage = await finalResult;

			const result: ChatOutput = {
				content: finalMessage ?? '',
				usage: stream.usage,
			};

			// Emit a progress update to the frontend to indicate that the workflow is complete
			streamJSONEvent(streamController, {
				type: 'progress_update',
				state: 'complete',
				text: 'Generated email',
			});

			return result;
		}

		// Non-streaming path
		const response = await emailAgent.generate(messages, {
			...(systemPrompt ? ({ instructions: systemPrompt } as const) : {}),
			temperature,
			maxTokens,
			...(resourceId &&
				threadId && { memory: { resource: resourceId, thread: threadId } }),
		});

		const result: ChatOutput = {
			content: response.text,
			usage: response.usage,
		};

		return result;
	},
});

export const emailWorkflow = createWorkflow({
	id: 'emailWorkflow',
	description:
		'Chat workflow that replicates the old /chat/execute-function endpoint behaviour with optional streaming',
	inputSchema: ChatInputSchema,
	outputSchema: ChatOutputSchema,
})
	.then(prepareAgentContext)
	.then(callAgent)
	.commit();
