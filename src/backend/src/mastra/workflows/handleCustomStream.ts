import { streamAudioFromText } from '../../utils/streamUtils';

// ==========================================
// CUSTOM STREAMING PROTOCOL DEFINITIONS
// ==========================================

/**
 * Frontend state update event.
 * Triggers state management actions in the UI (e.g., updating email drafts).
 */
export interface ActionEvent {
	type: 'action';
	content?: string;
	stateKey: string;
	setterKey: string;
	args: any[];
}

/**
 * Workflow progress update event.
 * Shows current status of long-running operations to users.
 */
export interface ProgressEvent {
	type: 'progress_update';
	state: 'in_progress' | 'complete' | 'error';
	text: string;
}

/**
 * Voice transcription result event.
 * Sent at the beginning of voice streams to show what was heard.
 */
export interface TranscriptionEvent {
	type: 'transcription';
	transcription: string;
}

/**
 * Audio output event.
 * Contains base64-encoded audio data for voice responses.
 */
export interface AudioEvent {
	type: 'audio';
	audioData: string; // base64 encoded
	audioFormat: 'audio/mpeg';
	content: string; // original text that was spoken
}

/**
 * Mastra event types for nested streaming support.
 * These events are forwarded directly from Mastra primitives.
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

/**
 * Mastra nested streaming events (pass-through).
 * These contain tool execution details and workflow state.
 */
export interface MastraEvent {
	type: MastraEventType;
	payload?: any;
}

/**
 * Error event.
 * Sent when streaming encounters an error condition.
 */
export interface ErrorEvent {
	type: 'error';
	message: string;
}

/**
 * Complete union of all custom streaming events sent to frontend.
 * This defines the protocol contract between backend streaming and frontend parsing.
 */
export type CustomStreamEvent =
	| ActionEvent
	| ProgressEvent
	| TranscriptionEvent
	| AudioEvent
	| ErrorEvent
	| MastraEvent;

// ==========================================
// STREAMING FUNCTIONS
// ==========================================

/**
 * Emit a custom streaming event as JSON over SSE data-only format.
 *
 * This function implements the custom protocol for streaming structured events
 * to the frontend. All events are sent as JSON through the SSE 'data:' field.
 *
 * @param controller - The SSE stream controller
 * @param eventData - The event to stream (must conform to CustomStreamEvent types)
 */
export function streamJSONEvent(
	controller: ReadableStreamDefaultController<Uint8Array>,
	eventData: CustomStreamEvent
) {
	const encoder = new TextEncoder();
	controller.enqueue(encoder.encode('data: '));
	controller.enqueue(encoder.encode(`${JSON.stringify(eventData)}\n\n`));
}

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
	speakFn: (
		t: string,
		options?: Record<string, unknown>
	) => Promise<ReadableStream>
) {
	if (isVoice && pendingText.value) {
		await streamAudioFromText(streamController, speakFn, pendingText.value, {
			voice: 'alloy',
			speed: 1.0,
			eventType: 'audio',
		});
		pendingText.value = '';
	}
	streamJSONEvent(streamController, chunk);
}

export async function handleToolResult(
	chunk: any,
	isVoice: boolean,
	pendingText: { value: string },
	streamController: ReadableStreamDefaultController<Uint8Array>,
	speakFn: (
		t: string,
		options?: Record<string, unknown>
	) => Promise<ReadableStream>
) {
	if (isVoice && pendingText.value) {
		await streamAudioFromText(streamController, speakFn, pendingText.value, {
			voice: 'alloy',
			speed: 1.0,
			eventType: 'audio',
		});
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
