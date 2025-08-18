import { ToolResultPayload } from '@/app/cedar-os/messageRenderers';
import {
	createResponseProcessor,
	CustomStructuredResponseType,
	MessageInput,
} from 'cedar-os';

type ToolResultResponse = CustomStructuredResponseType<
	'tool-result', // type field of custom response to listen for
	{
		payload: ToolResultPayload;
	}
>;

// Check for tool-call results and mark them as complete
export const processToolResultResponse =
	createResponseProcessor<ToolResultResponse>({
		type: 'tool-result',
		execute: async (response, store) => {
			// Narrowly typed response
			const latestMessage = store.messages[store.messages.length - 1];
			if (latestMessage.type !== 'tool-call') {
				return;
			}

			latestMessage.metadata = { complete: true };
			store.setMessages(
				store.messages.map((m) =>
					m.id === latestMessage.id ? latestMessage : m
				)
			);
			store.addMessage(response as unknown as MessageInput);
		},
	});

export const responseProcessors = [processToolResultResponse];
