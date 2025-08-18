import {
	MessageRenderer,
	CustomMessage,
	MastraStreamedResponse,
	ActionMessageFor,
	Message,
} from 'cedar-os';
import TodoList from '@/app/cedar-os/components/chatMessages/TodoList';

type SearchPersonToolResultPayload = {
	toolCallId: string;
	toolName: string;
	result: {
		name: string;
		role: string;
		emailStyleSummary: string;
		notes: string[];
	};
};

type CheckCalendarToolResultPayload = {
	toolCallId: string;
	toolName: string;
	result: {
		availableTimes: string[];
	};
};

export type ToolResultPayload =
	| SearchPersonToolResultPayload
	| CheckCalendarToolResultPayload;

type CustomToolMessage = CustomMessage<
	'tool-result',
	MastraStreamedResponse & {
		type: 'tool-result';
		payload: ToolResultPayload;
	}
>;

type PersonResult = SearchPersonToolResultPayload['result'];
type CalendarResult = CheckCalendarToolResultPayload['result'];

type ToolCallPayload = {
	toolCallId?: string;
	toolName?: string;
	args?: unknown;
};

type CustomToolCallMessage = CustomMessage<
	'tool-call',
	MastraStreamedResponse & {
		type: 'tool-call';
		payload: ToolCallPayload;
	}
>;

function isCalendarResult(
	result: PersonResult | CalendarResult | undefined
): result is CalendarResult {
	return !!result && Array.isArray((result as CalendarResult).availableTimes);
}

function isPersonResult(
	result: PersonResult | CalendarResult | undefined
): result is PersonResult {
	return (
		!!result && typeof (result as PersonResult).emailStyleSummary === 'string'
	);
}

function extractQuery(args: unknown): string {
	if (typeof args === 'object' && args !== null) {
		// Try object shape { query: string }
		const obj = args as Record<string, unknown>;
		const q = obj['query'];
		if (typeof q === 'string') return q;
	}
	if (Array.isArray(args) && args.length > 0) {
		const first = args[0] as unknown;
		if (typeof first === 'object' && first !== null) {
			const inner = first as Record<string, unknown>;
			const q = inner['query'];
			if (typeof q === 'string') return q;
		}
	}
	return '';
}

const toolCallPhrases: Record<string, (payload: ToolCallPayload) => string> = {
	checkCalendarTool: () => 'Checking your calendar...',
	searchPersonTool: (payload) => {
		const query = extractQuery(payload.args);
		return query ? `Searching for ${query}` : 'Searching for conversations...';
	},
	writeEmailTool: () => 'Writing response email...',
};

export const toolCallMessageRenderer: MessageRenderer<CustomToolCallMessage> = {
	type: 'tool-call',
	render: (message) => {
		const toolPayload = (message as CustomToolCallMessage).payload;
		const toolName = toolPayload.toolName || '';
		const phraseResolver = toolCallPhrases[toolName];
		const text = phraseResolver ? phraseResolver(toolPayload) : 'Working...';
		return (
			<TodoList
				message={{
					items: [
						{
							text: text,
							done: (message.metadata?.complete as boolean) ?? false,
						},
					],
					...message,
					type: 'todolist',
				}}
			/>
		);
	},
};

export const toolResultMessageRenderer: MessageRenderer<CustomToolMessage> = {
	type: 'tool-result',
	render: (message) => {
		const toolPayload = (message as CustomToolMessage).payload;
		const toolName: string | undefined = (
			toolPayload as SearchPersonToolResultPayload
		)?.toolName;
		const result = (toolPayload as SearchPersonToolResultPayload)?.result;

		if (isCalendarResult(result)) {
			// Calendar tool result
			return (
				<div className='text-sm space-y-2'>
					<div className='font-medium'>Available times</div>
					<ul className='list-disc pl-5 space-y-1'>
						{result.availableTimes.map((t: string, idx: number) => (
							<li key={idx}>{t}</li>
						))}
					</ul>
					{toolName && (
						<div className='text-xs text-gray-500'>Source: {toolName}</div>
					)}
				</div>
			);
		}

		if (isPersonResult(result)) {
			// Person search tool result
			return (
				<div className='text-sm space-y-2'>
					{result.name && (
						<div>
							<span className='font-medium'>Name: </span>
							<span>{result.name}</span>
						</div>
					)}
					{result.role && (
						<div>
							<span className='font-medium'>Role: </span>
							<span>{result.role}</span>
						</div>
					)}
					{result.emailStyleSummary && (
						<div>
							<span className='font-medium'>Email style: </span>
							<span>{result.emailStyleSummary}</span>
						</div>
					)}
					{Array.isArray(result.notes) && result.notes.length > 0 && (
						<div>
							<div className='font-medium mb-1'>Notes</div>
							<ul className='list-disc pl-5 space-y-1'>
								{result.notes.map((n: string, idx: number) => (
									<li key={idx}>{n}</li>
								))}
							</ul>
						</div>
					)}
					{toolName && (
						<div className='text-xs text-gray-500'>Source: {toolName}</div>
					)}
				</div>
			);
		}

		// Fallback: show raw content/payload
		return (
			<div className='text-sm'>
				<pre className='whitespace-pre-wrap'>
					{typeof message.content === 'string'
						? message.content
						: JSON.stringify(message.payload, null, 2)}
				</pre>
			</div>
		);
	},
};

export type ActionResultMessage = ActionMessageFor<
	'emailDraft',
	'draftReply',
	[string]
>;

export const actionResultMessageRenderer: MessageRenderer<ActionResultMessage> =
	{
		type: 'action',
		render: (message) => {
			return <div>Drafted email: {message.args[0].slice(0, 100) + '...'}</div>;
		},
	};

export const messageRenderers = [
	toolCallMessageRenderer,
	toolResultMessageRenderer,
	actionResultMessageRenderer,
] as MessageRenderer<Message>[];
