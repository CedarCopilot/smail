import { Context } from 'hono';
import { Readable } from 'stream';
import { createSSEStream, streamJSONEvent } from '../../utils/streamUtils';
import { emailWorkflow } from './emailWorkflow';
import { createWorkflowInput } from './sharedUtils';
import { voiceProvider } from './voiceUtils';

export async function handleVoiceStream(c: Context) {
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
			const result = await run.start(createWorkflowInput({
				prompt: transcription,
				additionalContext: parsedAdditionalContext ?? additionalContext,
				temperature: undefined,
				maxTokens: undefined,
				systemPrompt: undefined,
				resourceId: undefined,
				threadId: undefined,
			}, controller, true));
			
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
}