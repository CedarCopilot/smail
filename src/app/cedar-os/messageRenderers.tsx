import {
	MessageRenderer,
	CustomMessage,
	MastraStreamedResponse,
	ActionMessageFor,
	Message,
} from 'cedar-os';
import Flat3dContainer from '@/app/cedar-os/components/containers/Flat3dContainer';
import ColouredContainer from '@/app/cedar-os/components/structural/ColouredContainer';
import ColouredContainerItem from '@/app/cedar-os/components/structural/ColouredContainerItem';
import { CheckCircle, Circle, Clock } from 'lucide-react';
import { itemVariants } from '@/app/cedar-os/components/structural/animationVariants';
import { motion } from 'motion/react';
//
// ------------------------------------------------
// Helpers
// ------------------------------------------------

type PersonResult = SearchPersonToolResultPayload['result'];
type CalendarResult = CheckCalendarToolResultPayload['result'];

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

function formatDateTime(isoString: string): string {
	const date = new Date(isoString);
	const now = new Date();

	// Get day of week
	const dayNames = [
		'Sunday',
		'Monday',
		'Tuesday',
		'Wednesday',
		'Thursday',
		'Friday',
		'Saturday',
	];
	const monthNames = [
		'Jan',
		'Feb',
		'Mar',
		'Apr',
		'May',
		'Jun',
		'Jul',
		'Aug',
		'Sep',
		'Oct',
		'Nov',
		'Dec',
	];

	const dayOfWeek = dayNames[date.getDay()];
	const month = monthNames[date.getMonth()];
	const dayOfMonth = date.getDate();
	const year = date.getFullYear();

	// Get ordinal suffix
	const getOrdinalSuffix = (day: number) => {
		if (day >= 11 && day <= 13) return 'th';
		switch (day % 10) {
			case 1:
				return 'st';
			case 2:
				return 'nd';
			case 3:
				return 'rd';
			default:
				return 'th';
		}
	};

	// Format time
	const hours = date.getHours();
	const minutes = date.getMinutes();
	const ampm = hours >= 12 ? 'pm' : 'am';
	const displayHours = hours % 12 || 12;
	const timeString =
		minutes === 0
			? `${displayHours}${ampm}`
			: `${displayHours}:${minutes.toString().padStart(2, '0')}${ampm}`;

	// Check if it's today, tomorrow, or this week
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	const tomorrow = new Date(today);
	tomorrow.setDate(tomorrow.getDate() + 1);
	const dateOnly = new Date(
		date.getFullYear(),
		date.getMonth(),
		date.getDate()
	);

	// Format: "2am Today - Monday, Aug 18th"
	const shortDate = `${dayOfWeek}, ${month} ${dayOfMonth}${getOrdinalSuffix(dayOfMonth)}`;

	if (dateOnly.getTime() === today.getTime()) {
		return `${timeString} Today - ${shortDate}`;
	} else if (dateOnly.getTime() === tomorrow.getTime()) {
		return `${timeString} Tomorrow - ${shortDate}`;
	} else {
		return `${timeString} ${shortDate}`;
	}
}

const toolCallPhrases: Record<string, (payload: ToolCallPayload) => string> = {
	checkCalendarTool: () => 'Check calendar for available times',
	searchPersonTool: (payload) => {
		const query = extractQuery(payload.args);
		return query ? `Search for ${query}` : 'Search for conversations';
	},
	writeEmailTool: () => 'Write response email',
};

// ------------------------------------------------
// TOOL RESULT RENDERING
// ------------------------------------------------
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

// Render tool result messages
export const toolResultMessageRenderer: MessageRenderer<CustomToolMessage> = {
	type: 'tool-result',
	render: (message) => {
		const toolPayload = message.payload;
		const toolName: string | undefined = toolPayload?.toolName;
		const result = toolPayload?.result;

		if (isCalendarResult(result)) {
			// Calendar tool result
			return (
				<div className='space-y-3 w-full'>
					<motion.div
						variants={itemVariants}
						className='flex items-center justify-between mb-2'>
						<div className='flex items-center gap-3'>
							<div className='rounded-2xl bg-blue-500/10 backdrop-blur-sm'>
								<Clock className='w-6 h-6 text-blue-500' />
							</div>
							<h3 className='text-lg font-bold'>Available Times</h3>
						</div>
					</motion.div>

					<motion.div
						variants={itemVariants}
						className='space-y-3 text-muted-foreground'>
						{toolName && (
							<div className='text-xs text-gray-500'>Source: {toolName}</div>
						)}
					</motion.div>

					{result.availableTimes.map((t: string, idx: number) => (
						<ColouredContainer
							key={idx}
							color='blue'
							className='text-sm w-full'>
							<div className='flex items-center gap-2'>
								<Clock size={16} className='text-blue-600 flex-shrink-0' />
								<span className=''>{formatDateTime(t)}</span>
							</div>
						</ColouredContainer>
					))}
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
	},
};

// ------------------------------------------------
// TOOL CALL RENDERING
// ------------------------------------------------
type ToolCallPayload = {
	toolCallId?: string;
	toolName?: string;
	args?: unknown;
};

type CustomToolCallMessage = CustomMessage<
	'tool-call', // type field of custom message
	MastraStreamedResponse & {
		type: 'tool-call';
		payload: ToolCallPayload;
	}
>;

// Render tool call messages
export const toolCallMessageRenderer: MessageRenderer<CustomToolCallMessage> = {
	type: 'tool-call',
	render: (message) => {
		// Narrowly typed message
		const toolPayload = message.payload;
		const toolName = toolPayload.toolName || '';
		const phraseResolver = toolCallPhrases[toolName];
		const text = phraseResolver ? phraseResolver(toolPayload) : 'Working...';
		const completed = message.metadata?.complete ?? false;
		if (completed === true) {
			return (
				<Flat3dContainer className='p-3 opacity-50 my-2'>
					<div className='flex flex-row items-center justify-between w-full'>
						<div className='text-sm font-medium line-through text-gray-500'>
							{text}
						</div>
						<CheckCircle size={16} className='text-green-700' />
					</div>
				</Flat3dContainer>
			);
		}

		if (completed === false) {
			return (
				<Flat3dContainer className='p-3 my-2'>
					<div className='flex flex-row items-center justify-between w-full'>
						<div className='text-sm font-medium'>{text}</div>
						<Circle size={16} className='text-gray-500' />
					</div>
				</Flat3dContainer>
			);
		}
	},
};

// ------------------------------------------------
// ACTION RENDERING (frontend state changes)
// ------------------------------------------------
export type ActionResultMessage = ActionMessageFor<
	'emailDraft', // state key
	'draftReply', // setter key
	[string] // args
>;

export const actionResultMessageRenderer: MessageRenderer<ActionResultMessage> =
	{
		type: 'action',
		render: (message) => {
			switch (message.setterKey) {
				case 'draftReply':
					return (
						<div>Drafted email: {message.args[0].slice(0, 100) + '...'}</div>
					);
				default:
					return <div>Executed setter: {message.setterKey}</div>;
			}
		},
	};

// Export all message renderers to register with Cedar OS
export const messageRenderers = [
	toolCallMessageRenderer,
	toolResultMessageRenderer,
	actionResultMessageRenderer,
] as MessageRenderer<Message>[];
