// ---------------------------------------------
// Workflows are a Mastra primitive to orchestrate agents and complex sequences of tasks
// Docs: https://mastra.ai/en/docs/workflows/overview
// ---------------------------------------------

import { createWorkflow, createStep } from '@mastra/core/workflows';
import { z } from 'zod';
import { emailAgent } from '../agents/emailAgent';
import { streamJSONEvent, streamAudioFromText } from '../../utils/streamUtils';
import { OpenAIVoice } from '@mastra/voice-openai';
import { ActionResponseSchema } from './chatWorkflowTypes';

// ---------------------------------------------
// Mastra nested streaming – emit placeholder events
// ---------------------------------------------

/**
 * All possible event types that can be emitted by Mastra primitives when using the
 * new nested streaming support (see https://mastra.ai/blog/nested-streaming-support).
 */
export type MastraEventType =
	| 'start'
	| 'step-start'
	| 'tool-call'
	| 'tool-result'
	| 'step-finish'
	| 'tool-output'
	| 'step-result'
	| 'step-output'
	| 'finish';

// Intentionally not emitting placeholder events; real nested events come from the agent stream

// Pre-defined sample event objects that follow the shapes shown in the
// nested-streaming blog post. These are purely illustrative and use mock IDs.
// (Reference examples removed to avoid unused-variable warnings)

// The emitMastraEvents step will be declared after buildAgentContext to ensure
// buildAgentContext is defined before we reference it.

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

export type ChatOutput = z.infer<typeof ChatOutputSchema>;

// 1. fetchContext – passthrough (placeholder)
const fetchContext = createStep({
	id: 'fetchContext',
	description:
		'Placeholder step – you might want to fetch some information for your agent here',
	inputSchema: ChatInputSchema,
	outputSchema: ChatInputSchema.extend({
		context: z.any().optional(),
	}),
	execute: async ({ inputData }) => {
		// Extract and stringify the `value` object from additionalContext
		const userPrompt = inputData.prompt;
		const valueObj =
			inputData.additionalContext?.currentEmailBeingViewed?.[0]?.data?.value;
		const additionalContext = valueObj ? JSON.stringify(valueObj) : undefined;

		const result = { ...inputData, prompt: userPrompt, additionalContext };
		return result;
	},
});

// 2. buildAgentContext – build message array
const buildAgentContext = createStep({
	id: 'buildAgentContext',
	description: 'Combine fetched information and build LLM messages',
	inputSchema: fetchContext.outputSchema,
	outputSchema: ChatInputSchema.extend({
		messages: z.array(
			z.object({
				role: z.enum(['system', 'user', 'assistant']),
				content: z.string(),
			})
		),
	}),
	execute: async ({ inputData }) => {
		const {
			prompt,
			temperature,
			maxTokens,
			streamController,
			resourceId,
			threadId,
			additionalContext,
		} = inputData;

		const messages = [
			{ role: 'user' as const, content: prompt },
			...(additionalContext
				? [
						{
							role: 'user' as const,
							content: `Current email user is looking at: ${additionalContext}`,
						},
					]
				: []),
		];

		const result = {
			...inputData,
			messages,
			temperature,
			maxTokens,
			streamController,
			resourceId,
			threadId,
			additionalContext,
		};

		return result;
	},
});

// Removed placeholder nested streaming emitter; rely on agent-provided nested streaming

// 3. callAgent – invoke calendarAgent with nested streaming
const callAgent = createStep({
	id: 'callAgent',
	description: 'Invoke the chat agent with options',
	inputSchema: buildAgentContext.outputSchema,
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

			const stream = emailAgent.streamVNext(messages, {
				...(systemPrompt ? ({ instructions: systemPrompt } as const) : {}),
				temperature,
				maxTokens,
				...(resourceId &&
					threadId && { memory: { resource: resourceId, thread: threadId } }),
			});
			const voiceProvider = new OpenAIVoice({
				speechModel: { apiKey: process.env.OPENAI_API_KEY!, name: 'tts-1' },
				listeningModel: {
					apiKey: process.env.OPENAI_API_KEY!,
					name: 'whisper-1',
				},
			});
			const encoder = new TextEncoder();
			let pendingText = '';

			for await (const chunk of stream) {
				if (!chunk || !chunk.type) continue;
				switch (chunk.type) {
					case 'text-delta': {
						const text =
							(chunk as { payload?: { text?: string } }).payload?.text ?? '';
						if (!text) break;
						if (isVoice) {
							pendingText += text;
						} else {
							const escaped = text.replace(/\n/g, '\\n');
							streamController.enqueue(encoder.encode(`data:${escaped}\n\n`));
						}
						break;
					}
					case 'tool-call': {
						if (isVoice && pendingText) {
							const speakFn = (t: string, options?: Record<string, unknown>) =>
								voiceProvider.speak(
									t,
									options as { speaker?: string; speed?: number }
								) as unknown as Promise<ReadableStream>;
							await streamAudioFromText(
								streamController,
								speakFn,
								pendingText,
								{
									voice: 'alloy',
									speed: 1.0,
									eventType: 'audio',
								}
							);
							pendingText = '';
						}
						streamJSONEvent(streamController, chunk);
						break;
					}
					case 'tool-result': {
						if (isVoice && pendingText) {
							const speakFn = (t: string, options?: Record<string, unknown>) =>
								voiceProvider.speak(
									t,
									options as { speaker?: string; speed?: number }
								) as unknown as Promise<ReadableStream>;
							await streamAudioFromText(
								streamController,
								speakFn,
								pendingText,
								{
									voice: 'alloy',
									speed: 1.0,
									eventType: 'audio',
								}
							);
							pendingText = '';
						}
						const toolName = chunk.payload?.toolName as string | undefined;

						// If write-email returns, emit a Cedar action to update the compose draft
						if (toolName === 'writeEmailTool') {
							const email =
								(chunk.payload?.result as { email?: string })?.email || '';
							streamJSONEvent(streamController, chunk);
							streamJSONEvent(streamController, {
								type: 'action',
								stateKey: 'emailDraft',
								setterKey: 'draftReply',
								args: [email],
							});
							break;
						}

						// Forward other tool results for custom renderers
						streamJSONEvent(streamController, chunk);
						break;
					}
				}
			}

			// Access convenience promises exposed by the stream
			const finalResult = stream.text;

			if (isVoice && pendingText) {
				const speakFn = (t: string, options?: Record<string, unknown>) =>
					voiceProvider.speak(
						t,
						options as { speaker?: string; speed?: number }
					) as unknown as Promise<ReadableStream>;
				await streamAudioFromText(streamController, speakFn, pendingText, {
					voice: 'alloy',
					speed: 1.0,
					eventType: 'audio',
				});
				pendingText = '';
			}

			const finalMessage = await finalResult;

			const result: ChatOutput = {
				content: finalMessage ?? '',
				usage: stream.usage,
			};

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
	.then(fetchContext)
	.then(buildAgentContext)
	.then(callAgent)
	.commit();
