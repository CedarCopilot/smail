import { MessageInput, useCedarStore } from 'cedar-os';
import { RewriteDraftWorkflowInput } from './types';
import { llmProvider } from '@/app/cedar-os/configs';

export const rewriteDraftWorkflow = async (
	input: RewriteDraftWorkflowInput,
	messageId?: string
) => {
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
			stream: true,
			prompt: input.prompt,
			route: `/chat/rewrite-draft`,
			// Fields required by backend handler (top-level)
			wordCount: input.wordCount,
			currentDraft: input.currentDraft,
			rangeContext: input.rangeContext,
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
