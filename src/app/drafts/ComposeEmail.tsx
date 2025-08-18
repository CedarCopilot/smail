'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import {
	X,
	Minimize2,
	Maximize2,
	Trash2,
	Paperclip,
	Image as ImageIcon,
	Link,
	Smile,
	MoreVertical,
	ChevronDown,
} from 'lucide-react';
import { useEmailStore } from '@/app/store/emailStore';
import { EmailAddress } from '@/app/types';
import { useRegisterState, useCedarStore } from 'cedar-os';
import type { ComposeEmailData } from '@/app/types';
import { AnimatePresence } from 'motion/react';
import PhantomText from '@/app/cedar-os/components/text/PhantomText';

interface ComposeEmailProps {
	draftId: string;
	inline?: boolean;
}

export function ComposeEmail({ draftId, inline = false }: ComposeEmailProps) {
	const {
		composeDrafts,
		updateComposeDraft,
		updateComposeDraftData,
		closeComposeDraft,
		sendEmailFromDraft,
		saveDraftFromCompose,
		isGmailConnected,
	} = useEmailStore();

	const draft = composeDrafts.find((d) => d.id === draftId);

	const [showCc, setShowCc] = useState(false);
	const [showBcc, setShowBcc] = useState(false);
	const bodyRef = useRef<HTMLTextAreaElement>(null);

	// State for slider control
	const [isSliderActive, setIsSliderActive] = useState(false);
	const [phantomWordCount, setPhantomWordCount] = useState(50);

	// Memoize custom setters to avoid config identity changes on each render
	const draftReplySetters = useMemo(
		() => ({
			draftReply: {
				name: 'draftReply',
				description: 'Set the current email draft body to the provided string.',
				parameters: [
					{ name: 'draft', type: 'string', description: 'Email body content' },
				],
				execute: (_current: Partial<ComposeEmailData>, ...args: unknown[]) => {
					const setCedarState = useCedarStore.getState().setCedarState;
					const draftBody = String(args[0] ?? '');
					setCedarState('emailDraft', { body: draftBody });
				},
			},
		}),
		[]
	);

	const initialEmailDraftValue = useMemo<Partial<ComposeEmailData>>(
		() => ({}),
		[]
	);

	// Register the Cedar state and its custom setter once mounted
	useRegisterState<Partial<ComposeEmailData>>({
		key: 'emailDraft',
		// Use a stable initial value to avoid re-registration loops
		value: initialEmailDraftValue,
		customSetters: draftReplySetters,
	});

	// Subscribe to Cedar draft state and sync into this compose draft
	const cedarDraft = useCedarStore((state) =>
		state.getCedarState('emailDraft')
	) as Partial<ComposeEmailData>;

	// Subscribe to slider state (don't register it here, it's registered globally)
	const sliderState = useCedarStore((state) =>
		state.getCedarState('draftSliderState')
	) as { isActive: boolean; wordCount: number } | undefined;

	// Update local state when Cedar slider state changes
	useEffect(() => {
		if (sliderState) {
			// Only update if values actually changed to prevent loops
			if (sliderState.isActive !== isSliderActive) {
				setIsSliderActive(sliderState.isActive);
			}
			if (sliderState.wordCount !== phantomWordCount) {
				setPhantomWordCount(sliderState.wordCount);
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [sliderState?.isActive, sliderState?.wordCount]); // Use specific deps instead of whole object

	useEffect(() => {
		if (draft && !draft.isMinimized && bodyRef.current) {
			bodyRef.current.focus();
		}
	}, [draft, draft?.isMinimized]);

	// When Cedar's `emailDraft` updates its body, copy it into this draft
	useEffect(() => {
		if (!draft) return;
		const cedarBody = cedarDraft?.body || '';
		const currentBody = draft.data.body || '';
		if (cedarBody && cedarBody !== currentBody) {
			updateComposeDraftData(draftId, { body: cedarBody });
		}
	}, [cedarDraft?.body, draftId, draft, updateComposeDraftData]);

	if (!draft) return null;

	const handleSend = async () => {
		if (!draft.data.to?.length || !draft.data.subject) {
			alert('Please add recipients and a subject');
			return;
		}

		if (isGmailConnected) {
			try {
				// Send via Gmail API
				const response = await fetch('/api/gmail/send', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						to: draft.data.to,
						subject: draft.data.subject,
						body: draft.data.body || '',
						cc: draft.data.cc,
						bcc: draft.data.bcc,
					}),
				});

				if (!response.ok) {
					throw new Error('Failed to send email');
				}

				alert('Email sent successfully via Gmail!');
				closeComposeDraft(draftId);
			} catch (error) {
				console.error('Error sending email:', error);
				alert('Failed to send email. Please try again.');
			}
		} else {
			// Use mock send for demo
			sendEmailFromDraft(draftId);
		}
	};

	const handleAddRecipient = (field: 'to' | 'cc' | 'bcc', email: string) => {
		if (!email || !email.includes('@')) return;

		const newRecipient: EmailAddress = { email };
		const currentRecipients = draft.data[field] || [];

		updateComposeDraftData(draftId, {
			[field]: [...currentRecipients, newRecipient],
		});
	};

	const handleRemoveRecipient = (field: 'to' | 'cc' | 'bcc', index: number) => {
		const currentRecipients = draft.data[field] || [];
		updateComposeDraftData(draftId, {
			[field]: currentRecipients.filter((_, i) => i !== index),
		});
	};

	const RecipientInput = ({
		field,
		label,
	}: {
		field: 'to' | 'cc' | 'bcc';
		label: string;
	}) => {
		const [inputValue, setInputValue] = useState('');
		const recipients = draft.data[field] || [];

		return (
			<div className='flex items-center border-b border-gray-200 dark:border-gray-700 px-4 py-2'>
				<span className='text-sm text-gray-600 dark:text-gray-400 w-12'>
					{label}
				</span>
				<div className='flex-1 flex items-center gap-2 flex-wrap'>
					{recipients.map((recipient: EmailAddress, index: number) => (
						<span
							key={index}
							className='inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-sm'>
							{recipient.name || recipient.email}
							<button
								onClick={() => handleRemoveRecipient(field, index)}
								className='hover:text-red-500'>
								<X className='w-3 h-3' />
							</button>
						</span>
					))}
					<input
						type='email'
						value={inputValue}
						onChange={(e) => setInputValue(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === 'Enter' || e.key === ',') {
								e.preventDefault();
								handleAddRecipient(field, inputValue);
								setInputValue('');
							}
						}}
						onBlur={() => {
							if (inputValue) {
								handleAddRecipient(field, inputValue);
								setInputValue('');
							}
						}}
						placeholder='Add recipients'
						className='flex-1 min-w-[200px] bg-transparent outline-none text-sm'
					/>
				</div>
				{field === 'to' && (
					<div className='flex gap-2 text-sm'>
						<button
							onClick={() => setShowCc(!showCc)}
							className='text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'>
							Cc
						</button>
						<button
							onClick={() => setShowBcc(!showBcc)}
							className='text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'>
							Bcc
						</button>
					</div>
				)}
			</div>
		);
	};

	const wrapperClass = inline
		? 'h-full bg-white dark:bg-gray-900 rounded-lg shadow border border-gray-200 dark:border-gray-700 flex flex-col'
		: `bg-white dark:bg-gray-900 rounded-t-lg shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col ${
				draft.isFullscreen
					? 'w-full h-full'
					: draft.isMinimized
						? 'w-64 h-10'
						: 'w-[600px] h-[600px]'
			} transition-all duration-300`;

	return (
		<div className={wrapperClass}>
			{/* Header */}
			<div className='flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-t-lg'>
				<span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
					{draft.mode === 'new'
						? 'New Message'
						: draft.mode === 'reply'
							? 'Reply'
							: draft.mode === 'replyAll'
								? 'Reply All'
								: 'Forward'}
				</span>
				<div className='flex items-center gap-1'>
					{!inline && (
						<button
							onClick={() =>
								updateComposeDraft(draftId, { isMinimized: !draft.isMinimized })
							}
							className='p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded'>
							<Minimize2 className='w-4 h-4 text-gray-600 dark:text-gray-400' />
						</button>
					)}
					{!inline && (
						<button
							onClick={() =>
								updateComposeDraft(draftId, {
									isFullscreen: !draft.isFullscreen,
								})
							}
							className='p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded'>
							<Maximize2 className='w-4 h-4 text-gray-600 dark:text-gray-400' />
						</button>
					)}
					<button
						onClick={() => closeComposeDraft(draftId)}
						className='p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded'>
						<X className='w-4 h-4 text-gray-600 dark:text-gray-400' />
					</button>
				</div>
			</div>

			{!draft.isMinimized && (
				<>
					{/* Recipients */}
					<RecipientInput field='to' label='To' />
					{showCc && <RecipientInput field='cc' label='Cc' />}
					{showBcc && <RecipientInput field='bcc' label='Bcc' />}

					{/* Subject */}
					<div className='border-b border-gray-200 dark:border-gray-700 px-4 py-2'>
						<input
							type='text'
							value={draft.data.subject || ''}
							onChange={(e) =>
								updateComposeDraftData(draftId, { subject: e.target.value })
							}
							placeholder='Subject'
							className='w-full bg-transparent outline-none text-sm'
						/>
					</div>

					{/* Body */}
					<div
						className={`flex-1 p-4 ${inline ? 'min-h-[200px]' : ''} relative`}>
						<AnimatePresence mode='wait'>
							{isSliderActive ? (
								<PhantomText
									key='phantom'
									wordCount={phantomWordCount}
									className='text-sm leading-relaxed'
								/>
							) : (
								<textarea
									key='textarea'
									ref={bodyRef}
									value={draft.data.body || ''}
									onChange={(e) =>
										updateComposeDraftData(draftId, { body: e.target.value })
									}
									placeholder='Compose email'
									className='w-full h-full bg-transparent outline-none resize-none text-sm'
								/>
							)}
						</AnimatePresence>
					</div>

					{/* Footer */}
					<div className='border-t border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between rounded-b-lg'>
						<div className='flex items-center gap-2'>
							<button
								onClick={handleSend}
								className='px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm flex items-center gap-2'>
								Send
								<ChevronDown className='w-4 h-4' />
							</button>

							<div className='flex items-center gap-1 ml-4'>
								<button className='p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded'>
									<Paperclip className='w-4 h-4 text-gray-600 dark:text-gray-400' />
								</button>
								<button className='p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded'>
									<Link className='w-4 h-4 text-gray-600 dark:text-gray-400' />
								</button>
								<button className='p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded'>
									<Smile className='w-4 h-4 text-gray-600 dark:text-gray-400' />
								</button>
								<button className='p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded'>
									<ImageIcon className='w-4 h-4 text-gray-600 dark:text-gray-400' />
								</button>
								<button className='p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded'>
									<MoreVertical className='w-4 h-4 text-gray-600 dark:text-gray-400' />
								</button>
							</div>
						</div>

						<button
							onClick={() => saveDraftFromCompose(draftId)}
							className='p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded'>
							<Trash2 className='w-4 h-4 text-gray-600 dark:text-gray-400' />
						</button>
					</div>
				</>
			)}
		</div>
	);
}
