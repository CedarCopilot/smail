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
import {
	CheckCircle,
	Circle,
	Clock,
	User,
	Search,
	Calendar,
	ChevronDown,
	Copy,
} from 'lucide-react';
import {
	itemVariants,
	containerVariants,
} from '@/app/cedar-os/components/structural/animationVariants';
import { motion } from 'motion/react';
import { ShimmerText } from '@/app/cedar-os/components/text/ShimmerText';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

// ------------------------------------------------
// Interfaces
// ------------------------------------------------

export interface ProgressEvent {
	type: 'progress_update';
	state: 'in_progress' | 'complete';
	text: string;
}

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
						<div className='flex items-center gap-2'>
							<div className='rounded-2xl bg-blue-500/10 backdrop-blur-sm'>
								<Clock className='w-6 h-6 text-blue-500' />
							</div>
							<div className='text-md font-semibold'>Available Times</div>
						</div>
					</motion.div>

					<motion.div
						variants={itemVariants}
						className='space-y-3 text-muted-foreground'>
						{toolName && (
							<div className='text-xs text-gray-500'>Source: {toolName}</div>
						)}
					</motion.div>

					<motion.div
						variants={containerVariants}
						initial='hidden'
						animate='visible'
						className='space-y-3'>
						{result.availableTimes.map((t: string, idx: number) => (
							<motion.div key={idx} variants={itemVariants}>
								<ColouredContainer color='blue' className='text-sm w-full'>
									<div className='flex items-center gap-2'>
										<Clock size={16} className='text-blue-600 flex-shrink-0' />
										<span className=''>{formatDateTime(t)}</span>
									</div>
								</ColouredContainer>
							</motion.div>
						))}
					</motion.div>
				</div>
			);
		}

		if (isPersonResult(result)) {
			// Person search tool result
			return (
				<ColouredContainer color='purple' className='space-y-4'>
					{/* Header row with avatar, name, and role badge */}
					<div className='flex items-center justify-between'>
						<div className='flex items-center gap-2'>
							{/* Real avatar */}
							<img
								src='https://i.pravatar.cc/150?u=jane'
								alt='Avatar'
								className='w-6 h-6 rounded-full object-cover'
							/>
							{/* Name */}
							{result.name && (
								<div className='font-semibold text-base'>{result.name}</div>
							)}
						</div>
						{/* Role badge */}
						{result.role && (
							<Badge
								variant='secondary'
								className='bg-purple-100 text-purple-800 border-purple-200'>
								{result.role}
							</Badge>
						)}
					</div>

					{/* Email style */}
					{result.emailStyleSummary && (
						<div className='space-y-1 mt-2.5'>
							<div className='font-medium text-sm text-black'>Email Style</div>
							<div className='text-sm text-gray-700'>
								{result.emailStyleSummary}
							</div>
						</div>
					)}

					{/* Notes */}
					{Array.isArray(result.notes) && result.notes.length > 0 && (
						<div className='mt-2.5'>
							<div className='font-medium text-sm text-black'>Notes</div>
							<ul className='space-y-1'>
								{result.notes.map((n: string, idx: number) => (
									<li
										key={idx}
										className='text-sm text-gray-700 flex items-start gap-2'>
										<div className='w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 flex-shrink-0' />
										{n}
									</li>
								))}
							</ul>
						</div>
					)}

					{/* Action buttons */}
					<div className='flex gap-2 pt-3 w-full'>
						<Button
							variant='outline'
							size='sm'
							className='flex items-center gap-2 text-xs'>
							<Search className='w-3 h-3' />
							Search prev emails
						</Button>
						<Button
							variant='outline'
							size='sm'
							className='flex items-center gap-2 text-xs'>
							<Calendar className='w-3 h-3' />
							Open calendar
						</Button>
					</div>

					{/* Source info */}
					{/* {toolName && (
						<div className='text-xs text-gray-500 pt-2'>Source: {toolName}</div>
					)} */}
				</ColouredContainer>
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

		// Map completion state to ShimmerText state
		const shimmerState = completed === true ? 'complete' : 'in_progress';

		return (
			<ColouredContainer color='grey' className='mb-2'>
				<ShimmerText text={text} state={shimmerState} />
			</ColouredContainer>
		);
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
			const [isExpanded, setIsExpanded] = useState(false);

			switch (message.setterKey) {
				case 'draftReply':
					const emailContent = message.args[0];
					const previewLines = emailContent.split('\n').slice(0, 3).join('\n');
					const displayContent = isExpanded
						? emailContent
						: previewLines + (emailContent.split('\n').length > 3 ? '...' : '');

					return (
						<div
							className='relative group rounded-lg overflow-hidden w-full'
							style={{
								backgroundColor: '#1e1e1e',
								border: '1px solid rgba(255, 255, 255, 0.1)',
							}}>
							<div
								className='flex items-center justify-between px-4 py-2 text-xs bg-[#2d2d2d] w-full'
								style={{
									borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
									color: '#888',
								}}>
								<span className='font-mono'>Email Draft</span>
								<div className='flex items-center gap-2'>
									<button
										onClick={() => navigator.clipboard.writeText(emailContent)}
										className='flex items-center gap-1 px-2 py-1 rounded hover:bg-white/10 transition-colors'
										style={{ color: '#888' }}>
										<Copy className='w-3 h-3' />
										<span>Copy</span>
									</button>
									<button
										onClick={() => setIsExpanded(!isExpanded)}
										className='flex items-center gap-1 px-2 py-1 rounded hover:bg-white/10 transition-colors'
										style={{ color: '#888' }}>
										<ChevronDown
											className={`w-3 h-3 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
										/>
										<span>{isExpanded ? 'Collapse' : 'Expand'}</span>
									</button>
								</div>
							</div>
							<div className='p-4 overflow-x-auto w-full'>
								<div
									className='text-sm whitespace-pre-wrap w-full'
									style={{ color: 'white' }}>
									{displayContent}
								</div>
							</div>
						</div>
					);
				default:
					return <div>Executed setter: {message.setterKey}</div>;
			}
		},
	};

// ------------------------------------------------
// PROGRESS UPDATE RENDERING
// ------------------------------------------------

type CustomProgressMessage = CustomMessage<
	'progress_update',
	{
		type: 'progress_update';
		state?: 'in_progress' | 'complete';
		text?: string;
	}
>;

// Render progress update messages (same as tool-call)
export const progressUpdateMessageRenderer: MessageRenderer<CustomProgressMessage> =
	{
		type: 'progress_update',
		render: (message) => {
			const text = message.text || 'Working...';
			const state = message.state || 'in_progress';

			// Map progress state to ShimmerText state
			const shimmerState = state === 'complete' ? 'complete' : 'in_progress';

			return (
				<ColouredContainer color='grey' className='my-2'>
					<ShimmerText text={text} state={shimmerState} />
				</ColouredContainer>
			);
		},
	};

// Export all message renderers to register with Cedar OS
export const messageRenderers = [
	toolCallMessageRenderer,
	toolResultMessageRenderer,
	actionResultMessageRenderer,
	progressUpdateMessageRenderer,
] as MessageRenderer<Message>[];
