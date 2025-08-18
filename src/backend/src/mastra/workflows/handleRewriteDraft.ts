import { Context } from 'hono';
import { z } from 'zod';
import { createSSEStream, streamJSONEvent } from '../../utils/streamUtils';
import { rewriteAgent } from '../agents/rewriteAgent';

export async function handleRewriteDraft(c: Context) {
	try {
		const body = await c.req.json();
		const {
			prompt,
			wordCount,
			currentDraft,
			rangeContext,
			temperature,
			maxTokens,
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
}
