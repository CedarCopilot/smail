import { Context } from 'hono';
import { Readable } from 'stream';
import { emailWorkflow } from './emailWorkflow';
import { createWorkflowInput } from './sharedUtils';
import { voiceProvider } from './voiceUtils';

export async function handleVoice(c: Context) {
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
		const result = await run.start(
			createWorkflowInput({
				prompt: transcription,
				additionalContext: parsedAdditionalContext ?? additionalContext,
				temperature: undefined,
				maxTokens: undefined,
				systemPrompt: undefined,
				resourceId: undefined,
				threadId: undefined,
			})
		);

		if (result.status === 'success') {
			// Generate audio from the workflow response text
			const responseText = result.result.content;
			const speechStream = await voiceProvider.speak(responseText, {
				voice: 'alloy',
				speed: 1.0,
			});

			// Convert stream to buffer for response
			const chunks: Buffer[] = [];
			for await (const chunk of speechStream) {
				chunks.push(Buffer.from(chunk));
			}
			const audioResponse = Buffer.concat(chunks);

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
}
