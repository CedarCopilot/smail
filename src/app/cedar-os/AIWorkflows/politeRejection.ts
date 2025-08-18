import { MessageInput, useCedarStore } from 'cedar-os';
import { EmailWorkflowInput } from './types';
import { llmProvider } from '@/app/cedar-os/configs';

export const politeRejectionWorkflow = async (
	input: EmailWorkflowInput,
	messageId?: string
) => {
	const state = useCedarStore.getState();

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
