import { registerApiRoute } from '@mastra/core/server';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { z } from 'zod';
import { handleChat } from './workflows/handleChat';
import { handleChatStream } from './workflows/handleChatStream';
import { handleVoice } from './workflows/handleVoice';
import { handleVoiceStream } from './workflows/handleVoiceStream';
import { handleScheduleMeeting } from './workflows/handleScheduleMeeting';
import { handlePoliteRejection } from './workflows/handlePoliteRejection';
import { handleFollowUp } from './workflows/handleFollowUp';
import { handleThankYou } from './workflows/handleThankYou';
import { handleRewriteDraft } from './workflows/handleRewriteDraft';
import { ActionResponseSchema } from './workflows/chatWorkflowTypes';

// Intentionally not emitting placeholder events; real nested events come from the agent stream

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

// Helper function to convert Zod schema to OpenAPI schema
function toOpenApiSchema(schema: Parameters<typeof zodToJsonSchema>[0]) {
	return zodToJsonSchema(schema) as Record<string, unknown>;
}

// Register API routes to reach your Mastra server
export const apiRoutes = [
	// ---------------------------------------------
	// CHAT ROUTES
	// ---------------------------------------------
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
		handler: handleChat,
	}),
	// Voice transcription to chat workflow (non-streaming)
	registerApiRoute('/voice', {
		method: 'POST',
		handler: handleVoice,
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
		handler: handleChatStream,
	}),
	// Voice transcription to chat workflow (streaming)
	registerApiRoute('/voice/stream', {
		method: 'POST',
		handler: handleVoiceStream,
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
		handler: handleScheduleMeeting,
	}),

	// ---------------------------------------------
	// SPELL ROUTES
	// ---------------------------------------------

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
		handler: handlePoliteRejection,
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
		handler: handleFollowUp,
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
		handler: handleThankYou,
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
		handler: handleRewriteDraft,
	}),
];
