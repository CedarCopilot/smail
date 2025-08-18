import { streamJSONEvent, streamAudioFromText } from '../../utils/streamUtils';

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

export function handleTextDelta(
	chunk: { payload?: { text?: string } },
	isVoice: boolean,
	pendingText: { value: string },
	streamController: ReadableStreamDefaultController<Uint8Array>
) {
	const text = chunk.payload?.text ?? '';
	if (!text) return;
	
	if (isVoice) {
		pendingText.value += text;
	} else {
		const escaped = text.replace(/\n/g, '\\n');
		const encoder = new TextEncoder();
		streamController.enqueue(encoder.encode(`data:${escaped}\n\n`));
	}
}

export async function handleToolCall(
	chunk: any,
	isVoice: boolean,
	pendingText: { value: string },
	streamController: ReadableStreamDefaultController<Uint8Array>,
	speakFn: (t: string, options?: Record<string, unknown>) => Promise<ReadableStream>
) {
	if (isVoice && pendingText.value) {
		await streamAudioFromText(
			streamController,
			speakFn,
			pendingText.value,
			{
				voice: 'alloy',
				speed: 1.0,
				eventType: 'audio',
			}
		);
		pendingText.value = '';
	}
	streamJSONEvent(streamController, chunk);
}

export async function handleToolResult(
	chunk: any,
	isVoice: boolean,
	pendingText: { value: string },
	streamController: ReadableStreamDefaultController<Uint8Array>,
	speakFn: (t: string, options?: Record<string, unknown>) => Promise<ReadableStream>
) {
	if (isVoice && pendingText.value) {
		await streamAudioFromText(
			streamController,
			speakFn,
			pendingText.value,
			{
				voice: 'alloy',
				speed: 1.0,
				eventType: 'audio',
			}
		);
		pendingText.value = '';
	}
	
	const toolName = chunk.payload?.toolName as string | undefined;

	// If write-email returns, emit a Cedar action to update the compose draft
	if (toolName === 'writeEmailTool') {
		const email = (chunk.payload?.result as { email?: string })?.email || '';
		streamJSONEvent(streamController, chunk);
		streamJSONEvent(streamController, {
			type: 'action',
			stateKey: 'emailDraft',
			setterKey: 'draftReply',
			args: [email],
		});
		return;
	}

	// Forward other tool results for custom renderers
	streamJSONEvent(streamController, chunk);
}