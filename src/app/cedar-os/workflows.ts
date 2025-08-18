import { MessageInput, useCedarStore } from 'cedar-os';

export interface EmailWorkflowInput {
	prompt: string;
	context?: {
		recipientName?: string;
		recipientEmail?: string;
		originalEmail?: string;
	};
}

export interface RewriteDraftWorkflowInput {
	prompt: string;
	wordCount: number;
	currentDraft: {
		subject?: string;
		body?: string;
	};
	rangeContext?: {
		min: number;
		max: number;
		rangeName: string;
	};
}

const getLLMProvider = () => ({
	provider: 'mastra',
	baseURL: process.env.NEXT_PUBLIC_MASTRA_URL || 'http://localhost:4112',
	apiKey: process.env.NEXT_PUBLIC_MASTRA_API_KEY,
	chatPath: '',
});

export const scheduleMeetingWorkflow = async (
	input: EmailWorkflowInput,
	messageId?: string
) => {
	const state = useCedarStore.getState();
	const llmProvider = getLLMProvider();

	if (messageId) {
		const message = useCedarStore.getState().getMessageById(messageId);
		useCedarStore.getState().updateMessage(messageId, {
			...message,
			completed: true,
		} as MessageInput);
	}

	useCedarStore.getState().streamLLM(
		{
			input,
			productId: llmProvider.apiKey,
			additionalContext: state.stringifyAdditionalContext(),
			threadId: state.getCedarState('userId') as string,
			userId: state.getCedarState('userId') as string,
			stream: true,
			prompt: input.prompt,
			route: `/chat/schedule-meeting`,
		},
		(event) => {
			if (event.type === 'object') {
				useCedarStore
					.getState()
					.handleLLMResponse(
						Array.isArray(event.object) ? event.object : [event.object]
					);
			}
		}
	);
};

export const politeRejectionWorkflow = async (
	input: EmailWorkflowInput,
	messageId?: string
) => {
	const state = useCedarStore.getState();
	const llmProvider = getLLMProvider();

	if (messageId) {
		const message = useCedarStore.getState().getMessageById(messageId);
		useCedarStore.getState().updateMessage(messageId, {
			...message,
			completed: true,
		} as MessageInput);
	}

	useCedarStore.getState().streamLLM(
		{
			input,
			productId: llmProvider.apiKey,
			additionalContext: state.stringifyAdditionalContext(),
			threadId: state.getCedarState('userId') as string,
			userId: state.getCedarState('userId') as string,
			stream: true,
			prompt: input.prompt,
			route: `/chat/polite-rejection`,
		},
		(event) => {
			if (event.type === 'object') {
				useCedarStore
					.getState()
					.handleLLMResponse(
						Array.isArray(event.object) ? event.object : [event.object]
					);
			}
		}
	);
};

export const followUpWorkflow = async (
	input: EmailWorkflowInput,
	messageId?: string
) => {
	const state = useCedarStore.getState();
	const llmProvider = getLLMProvider();

	if (messageId) {
		const message = useCedarStore.getState().getMessageById(messageId);
		useCedarStore.getState().updateMessage(messageId, {
			...message,
			completed: true,
		} as MessageInput);
	}

	useCedarStore.getState().streamLLM(
		{
			input,
			productId: llmProvider.apiKey,
			additionalContext: state.stringifyAdditionalContext(),
			threadId: state.getCedarState('userId') as string,
			userId: state.getCedarState('userId') as string,
			stream: true,
			prompt: input.prompt,
			route: `/chat/follow-up`,
		},
		(event) => {
			if (event.type === 'object') {
				useCedarStore
					.getState()
					.handleLLMResponse(
						Array.isArray(event.object) ? event.object : [event.object]
					);
			}
		}
	);
};

export const thankYouWorkflow = async (
	input: EmailWorkflowInput,
	messageId?: string
) => {
	const state = useCedarStore.getState();
	const llmProvider = getLLMProvider();

	if (messageId) {
		const message = useCedarStore.getState().getMessageById(messageId);
		useCedarStore.getState().updateMessage(messageId, {
			...message,
			completed: true,
		} as MessageInput);
	}

	useCedarStore.getState().streamLLM(
		{
			input,
			productId: llmProvider.apiKey,
			additionalContext: state.stringifyAdditionalContext(),
			threadId: state.getCedarState('userId') as string,
			userId: state.getCedarState('userId') as string,
			stream: true,
			prompt: input.prompt,
			route: `/chat/thank-you`,
		},
		(event) => {
			if (event.type === 'object') {
				useCedarStore
					.getState()
					.handleLLMResponse(
						Array.isArray(event.object) ? event.object : [event.object]
					);
			}
		}
	);
};

export const rewriteDraftWorkflow = async (
	input: RewriteDraftWorkflowInput,
	messageId?: string
) => {
	const state = useCedarStore.getState();
	const llmProvider = getLLMProvider();

	if (messageId) {
		const message = useCedarStore.getState().getMessageById(messageId);
		useCedarStore.getState().updateMessage(messageId, {
			...message,
			completed: true,
		} as MessageInput);
	}

	useCedarStore.getState().streamLLM(
		{
			input,
			productId: llmProvider.apiKey,
			additionalContext: state.stringifyAdditionalContext(),
			threadId: state.getCedarState('userId') as string,
			userId: state.getCedarState('userId') as string,
			stream: true,
			prompt: input.prompt,
			route: `/chat/rewrite-draft`,
		},
		(event) => {
			if (event.type === 'object') {
				useCedarStore
					.getState()
					.handleLLMResponse(
						Array.isArray(event.object) ? event.object : [event.object]
					);
			}
		}
	);
};
