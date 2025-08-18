import { registerApiRoute } from '@mastra/core/server';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { z } from 'zod';
import { createSSEStream, streamJSONEvent } from '../utils/streamUtils';
import { OpenAIVoice } from '@mastra/voice-openai';
import { Readable } from 'stream';
import {
	emailWorkflow,
	ChatInputSchema,
	ChatOutput,
} from './workflows/emailWorkflow';
import { rewriteAgent } from './agents/rewriteAgent';

const voiceProvider = new OpenAIVoice({
	speechModel: { apiKey: process.env.OPENAI_API_KEY!, name: 'tts-1' },
	listeningModel: { apiKey: process.env.OPENAI_API_KEY!, name: 'whisper-1' },
});

// Helper function to convert Zod schema to OpenAPI schema
function toOpenApiSchema(schema: Parameters<typeof zodToJsonSchema>[0]) {
	return zodToJsonSchema(schema) as Record<string, unknown>;
}

// Register API routes to reach your Mastra server
export const apiRoutes = [
	registerApiRoute('/chat', {
		method: 'POST',
		openapi: {
			requestBody: {
				content: {
					'application/json': {
						schema: toOpenApiSchema(ChatInputSchema),
					},
				},
			},
		},
		handler: async (c) => {
			try {
				const body = await c.req.json();
				const {
					prompt,
					temperature,
					maxTokens,
					systemPrompt,
					resourceId,
					threadId,
					additionalContext,
				} = ChatInputSchema.parse(body);

				const run = await emailWorkflow.createRunAsync();
				const result = await run.start({
					inputData: {
						prompt,
						temperature,
						maxTokens,
						systemPrompt,
						resourceId,
						threadId,
						additionalContext,
					},
				});

				if (result.status === 'success') {
					// Simply forward the workflow response to the frontend
					return c.json<ChatOutput>(result.result);
				}
			} catch (error) {
				console.error(error);
				return c.json(
					{ error: error instanceof Error ? error.message : 'Internal error' },
					500
				);
			}
		},
	}),
	// Voice transcription to chat workflow (non-streaming)
	registerApiRoute('/voice', {
		method: 'POST',
		handler: async (c) => {
			try {
				const form = await c.req.formData();
				const audioFile = form.get('audio') as File;
				const additionalContext = form.get('context') as string | null;
				let parsedAdditionalContext: unknown = undefined;
				if (additionalContext) {
					try {
						parsedAdditionalContext = JSON.parse(additionalContext);
					} catch {
						// leave undefined if not valid JSON
					}
				}
				if (!audioFile) return c.json({ error: 'audio required' }, 400);

				const buf = Buffer.from(await audioFile.arrayBuffer());
				const transcription = await voiceProvider.listen(Readable.from(buf), {
					filetype: 'webm',
				});

				const run = await emailWorkflow.createRunAsync();
				const result = await run.start({
					inputData: {
						prompt: transcription,
						additionalContext: parsedAdditionalContext ?? additionalContext,
					},
				});

				if (result.status === 'success') {
					// Generate audio from the workflow response text
					const responseText = result.result.content;
					const speechStream = await voiceProvider.speak(responseText, {
						voice: 'alloy', // Default voice
						speed: 1.0,
					});

					// Convert stream to buffer for response
					const chunks: Buffer[] = [];
					for await (const chunk of speechStream) {
						chunks.push(Buffer.from(chunk));
					}
					const audioResponse = Buffer.concat(chunks);

					// Return response with audio data
					return c.json({
						transcription,
						text: responseText,
						usage: result.result.usage,
						object: result.result.object,
						audioData: audioResponse.toString('base64'),
						audioFormat: 'audio/mpeg',
					});
				}
				throw new Error(`Workflow failed: ${result.status}`);
			} catch (error) {
				console.error(error);
				return c.json(
					{ error: error instanceof Error ? error.message : 'Internal error' },
					500
				);
			}
		},
	}),
	registerApiRoute('/chat/stream', {
		method: 'POST',
		openapi: {
			requestBody: {
				content: {
					'application/json': {
						schema: toOpenApiSchema(ChatInputSchema),
					},
				},
			},
		},
		handler: async (c) => {
			try {
				const body = await c.req.json();
				const {
					prompt,
					temperature,
					maxTokens,
					systemPrompt,
					resourceId,
					threadId,
					additionalContext,
				} = ChatInputSchema.parse(body);

				return createSSEStream(async (controller) => {
					const run = await emailWorkflow.createRunAsync();
					const result = await run.start({
						inputData: {
							prompt,
							temperature,
							maxTokens,
							systemPrompt,
							additionalContext,
							streamController: controller,
							resourceId,
							threadId,
						},
					});

					if (result.status !== 'success') {
						throw new Error(`Workflow failed: ${result.status}`);
					}
				});
			} catch (error) {
				console.error(error);
				return c.json(
					{ error: error instanceof Error ? error.message : 'Internal error' },
					500
				);
			}
		},
	}),
	// Voice transcription to chat workflow (streaming)
	registerApiRoute('/voice/stream', {
		method: 'POST',
		handler: async (c) => {
			try {
				const form = await c.req.formData();
				const audioFile = form.get('audio') as File;
				const additionalContext = form.get('context') as string | null;
				let parsedAdditionalContext: unknown = undefined;
				if (additionalContext) {
					try {
						parsedAdditionalContext = JSON.parse(additionalContext);
					} catch {
						// leave undefined if not valid JSON
					}
				}
				if (!audioFile) return c.json({ error: 'audio required' }, 400);

				const buf = Buffer.from(await audioFile.arrayBuffer());
				const transcription = await voiceProvider.listen(Readable.from(buf), {
					filetype: 'webm',
				});

				return createSSEStream(async (controller) => {
					// Emit the transcription at the beginning of the stream
					streamJSONEvent(controller, {
						type: 'transcription',
						transcription,
					});

					const run = await emailWorkflow.createRunAsync();
					const result = await run.start({
						inputData: {
							prompt: transcription,
							additionalContext: parsedAdditionalContext ?? additionalContext,
							streamController: controller,
							isVoice: true,
						},
					});
					if (result.status !== 'success') {
						throw new Error(`Workflow failed: ${result.status}`);
					}
				});
			} catch (error) {
				console.error(error);
				return c.json(
					{ error: error instanceof Error ? error.message : 'Internal error' },
					500
				);
			}
		},
	}),
	// Schedule Meeting workflow
	registerApiRoute('/chat/schedule-meeting/stream', {
		method: 'POST',
		openapi: {
			requestBody: {
				content: {
					'application/json': {
						schema: toOpenApiSchema(ChatInputSchema),
					},
				},
			},
		},
		handler: async (c) => {
			console.log('in schedule meeting route');
			try {
				const body = await c.req.json();
				const {
					prompt,
					temperature,
					maxTokens,
					systemPrompt,
					resourceId,
					threadId,
					additionalContext,
				} = ChatInputSchema.parse(body);

				return createSSEStream(async (controller) => {
					// Simulate streaming response for schedule meeting
					streamJSONEvent(controller, {
						type: 'action',
						content:
							"I'll help you schedule a meeting. Let me draft a professional email...",
						stateKey: 'emailDraft',
						setterKey: 'draftReply',
						args: [
							'Dear [Recipient Name],\n\nI hope this email finds you well. I would like to schedule a meeting to discuss [topic]. Would you be available next week for a 30-minute conversation?\n\nPlease let me know what times work best for your schedule.\n\nBest regards,\n[Your Name]',
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
		},
	}),
	// Polite Rejection workflow
	registerApiRoute('/chat/polite-rejection/stream', {
		method: 'POST',
		openapi: {
			requestBody: {
				content: {
					'application/json': {
						schema: toOpenApiSchema(ChatInputSchema),
					},
				},
			},
		},
		handler: async (c) => {
			try {
				const body = await c.req.json();
				const {
					prompt,
					temperature,
					maxTokens,
					systemPrompt,
					resourceId,
					threadId,
					additionalContext,
				} = ChatInputSchema.parse(body);

				return createSSEStream(async (controller) => {
					// Simulate streaming response for polite rejection
					streamJSONEvent(controller, {
						type: 'action',
						content: "I'll help you craft a polite rejection email...",
						stateKey: 'emailDraft',
						setterKey: 'draftReply',
						args: [
							"Dear [Recipient Name],\n\nThank you for reaching out and for your interest. After careful consideration, I regret to inform you that I won't be able to proceed with this opportunity at this time.\n\nI appreciate your understanding and wish you the best with your endeavors.\n\nBest regards,\n[Your Name]",
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
		},
	}),
	// Follow Up workflow
	registerApiRoute('/chat/follow-up/stream', {
		method: 'POST',
		openapi: {
			requestBody: {
				content: {
					'application/json': {
						schema: toOpenApiSchema(ChatInputSchema),
					},
				},
			},
		},
		handler: async (c) => {
			try {
				const body = await c.req.json();
				const {
					prompt,
					temperature,
					maxTokens,
					systemPrompt,
					resourceId,
					threadId,
					additionalContext,
				} = ChatInputSchema.parse(body);

				return createSSEStream(async (controller) => {
					// Simulate streaming response for follow up
					streamJSONEvent(controller, {
						type: 'action',
						content: "I'll help you create a follow-up email...",
						stateKey: 'emailDraft',
						setterKey: 'draftReply',
						args: [
							"Dear [Recipient Name],\n\nI hope you're doing well. I wanted to follow up on our previous conversation regarding [topic].\n\nI understand you may be busy, but I wanted to check if you had a chance to consider my previous message. Please let me know if you need any additional information.\n\nLooking forward to hearing from you.\n\nBest regards,\n[Your Name]",
							'Following Up - [Original Subject]',
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
		},
	}),
	// Thank You workflow
	registerApiRoute('/chat/thank-you/stream', {
		method: 'POST',
		openapi: {
			requestBody: {
				content: {
					'application/json': {
						schema: toOpenApiSchema(ChatInputSchema),
					},
				},
			},
		},
		handler: async (c) => {
			try {
				const body = await c.req.json();
				const {
					prompt,
					temperature,
					maxTokens,
					systemPrompt,
					resourceId,
					threadId,
					additionalContext,
				} = ChatInputSchema.parse(body);

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
		},
	}),
	// Rewrite Draft workflow
	registerApiRoute('/chat/rewrite-draft/stream', {
		method: 'POST',
		openapi: {
			requestBody: {
				content: {
					'application/json': {
						schema: toOpenApiSchema(
							ChatInputSchema.extend({
								wordCount: z.number(),
								currentDraft: z.object({
									subject: z.string().optional(),
									body: z.string().optional(),
								}),
								rangeContext: z
									.object({
										min: z.number(),
										max: z.number(),
										rangeName: z.string(),
									})
									.optional(),
							})
						),
					},
				},
			},
		},
		handler: async (c) => {
			try {
				const body = await c.req.json();
				const {
					prompt,
					wordCount,
					currentDraft,
					rangeContext,
					temperature,
					maxTokens,
					systemPrompt,
					resourceId,
					threadId,
					additionalContext,
				} = body;

				return createSSEStream(async (controller) => {
					// Build the agent prompt with context
					const rewritePrompt = `
Please rewrite the following email to match a target of ${wordCount} words (within the ${rangeContext?.rangeName || 'specified'} range of ${rangeContext?.min || wordCount - 10}-${rangeContext?.max || wordCount + 10} words).

Current Email:
Subject: ${currentDraft?.subject || 'No subject'}
Body: ${currentDraft?.body || 'No content'}

User's Request: ${prompt}

Please rewrite this email maintaining its core message while fitting the target word count.`;

					// Stream progress update
					streamJSONEvent(controller, {
						type: 'progress_update',
						state: 'in_progress',
						text: 'Rewriting email draft...',
					});

					// Call the rewrite agent
					const response = await rewriteAgent.generate(
						[{ role: 'user', content: rewritePrompt }],
						{
							temperature: temperature || 0.7,
							maxTokens: maxTokens || 1000,
							experimental_output: z.object({
								rewrittenDraft: z.string(),
							}),
						}
					);

					const rewrittenDraft = response.object?.rewrittenDraft;

					streamJSONEvent(controller, {
						type: 'action',
						content: 'Email rewritten',
						stateKey: 'emailDraft',
						setterKey: 'draftReply',
						args: [rewrittenDraft, currentDraft?.subject || 'Rewritten Email'],
					});
				});
			} catch (error) {
				console.error(error);
				return c.json(
					{ error: error instanceof Error ? error.message : 'Internal error' },
					500
				);
			}
		},
	}),
];
