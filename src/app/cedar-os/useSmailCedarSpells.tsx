'use client';

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { Calendar, ThumbsDown, UserCheck, Heart } from 'lucide-react';
import RadialMenuSpell from '@/app/cedar-os/components/spells/RadialMenuSpell';
import type { RadialMenuItem } from '@/app/cedar-os/components/spells/RadialMenuSpell';
import RangeSliderSpell from '@/app/cedar-os/components/spells/RangeSliderSpell';
import type { RangeOption } from '@/app/cedar-os/components/spells/RangeSliderSpell';
import SliderSpell from '@/app/cedar-os/components/spells/SliderSpell';
import type { RangeMetadata } from '@/app/cedar-os/components/spells/SliderSpell';
import { useEmailStore } from '../store/emailStore';
import {
	rewriteDraftWorkflow,
	scheduleMeetingWorkflow,
	politeRejectionWorkflow,
	followUpWorkflow,
	thankYouWorkflow,
} from '@/app/cedar-os/AIWorkflows';
import {
	Hotkey,
	ActivationMode,
	useCedarStore,
	useRegisterState,
} from 'cedar-os';
import type { ActivationConditions } from 'cedar-os';

export function useSmailCedarSpells() {
	// Register slider state globally (once at the app level)
	useRegisterState<{ isActive: boolean; wordCount: number }>({
		key: 'draftSliderState',
		value: { isActive: false, wordCount: 50 },
	});

	const pathname = usePathname();
	const { openCompose } = useEmailStore();

	// Define radial menu items for AI-based email drafters
	const menuItems: RadialMenuItem[] = useMemo(
		() => [
			{
				title: 'Schedule Meeting',
				icon: Calendar,
				onInvoke: async () => {
					// Get current email context if available
					const emailId = pathname?.split('/inbox/')[1];
					const emails = useEmailStore.getState().emails;
					const currentEmail = emailId
						? emails.find((e) => e.id === emailId)
						: null;

					// Open compose first
					openCompose('new');

					// Use workflow to call backend
					await scheduleMeetingWorkflow(
						{
							prompt: 'Generate a professional email to schedule a meeting',
							context: {
								recipientName: currentEmail?.from?.name,
								recipientEmail: currentEmail?.from?.email,
							},
						},
						currentEmail?.id
					);
				},
			},
			{
				title: 'Polite Rejection',
				icon: ThumbsDown,
				onInvoke: async () => {
					const emailId = pathname?.split('/inbox/')[1];
					const emails = useEmailStore.getState().emails;
					const currentEmail = emailId
						? emails.find((e) => e.id === emailId)
						: null;

					// Open compose first
					if (currentEmail) {
						openCompose('reply', currentEmail);
					} else {
						openCompose('new');
					}

					// Use workflow to call backend
					await politeRejectionWorkflow(
						{
							prompt:
								'Generate a polite rejection email that declines an offer or request professionally',
							context: {
								recipientName: currentEmail?.from?.name,
								recipientEmail: currentEmail?.from?.email,
								originalEmail: currentEmail?.body,
							},
						},
						currentEmail?.id
					);
				},
			},
			{
				title: 'Follow Up',
				icon: UserCheck,
				onInvoke: async () => {
					const emailId = pathname?.split('/inbox/')[1];
					const emails = useEmailStore.getState().emails;
					const currentEmail = emailId
						? emails.find((e) => e.id === emailId)
						: null;

					// Open compose first
					if (currentEmail) {
						openCompose('reply', currentEmail);
					} else {
						openCompose('new');
					}

					// Use workflow to call backend
					await followUpWorkflow(
						{
							prompt:
								'Generate a follow-up email to check on previous conversation or request',
							context: {
								recipientName: currentEmail?.from?.name,
								recipientEmail: currentEmail?.from?.email,
								originalEmail: currentEmail?.body,
							},
						},
						currentEmail?.id
					);
				},
			},
			{
				title: 'Thank You',
				icon: Heart,
				onInvoke: async () => {
					const emailId = pathname?.split('/inbox/')[1];
					const emails = useEmailStore.getState().emails;
					const currentEmail = emailId
						? emails.find((e) => e.id === emailId)
						: null;

					// Open compose first
					openCompose('new');

					// Use workflow to call backend
					await thankYouWorkflow(
						{
							prompt:
								'Generate a thank you email expressing appreciation and gratitude',
							context: {
								recipientName: currentEmail?.from?.name,
								recipientEmail: currentEmail?.from?.email,
							},
						},
						currentEmail?.id
					);
				},
			},
		],
		[pathname, openCompose]
	);

	// Activation conditions for 'g' key hold
	const activationConditions: ActivationConditions = useMemo(
		() => ({
			events: [Hotkey.G],
			mode: ActivationMode.TOGGLE,
		}),
		[]
	);

	// Define word count options for email drafts
	const wordCountOptions: RangeOption[] = useMemo(
		() => [
			{
				value: 10,
				text: 'Tweet (${value} words)',
				icon: '🐦',
				color: '#1DA1F2',
			},
			{
				value: 25,
				text: 'Summary (${value} words)',
				icon: '📝',
				color: '#10B981',
			},
			{
				value: 50,
				text: 'Paragraph (${value} words)',
				icon: '📄',
				color: '#F59E0B',
			},
			{
				value: 150,
				text: 'Short Article (${value} words)',
				icon: '📰',
				color: '#EF4444',
			},
			{
				value: 300,
				text: 'Blog Post (${value} words)',
				icon: '📖',
				color: '#8B5CF6',
			},
			{
				value: 500,
				text: 'Long Article (${value} words)',
				icon: '📚',
				color: '#EC4899',
			},
			{
				value: 1000,
				text: 'Essay (${value} words)',
				icon: '🎓',
				color: '#DC2626',
			},
		],
		[]
	);

	// Define word count ranges with metadata for email drafts (original SliderSpell)
	const wordCountRanges: RangeMetadata[] = useMemo(
		() => [
			{
				min: 5,
				max: 25,
				icon: '✍️',
				text: 'Brief (${value} words)',
				color: '#3B82F6',
			},
			{
				min: 25,
				max: 50,
				icon: '📝',
				text: 'Short (${value} words)',
				color: '#10B981',
			},
			{
				min: 50,
				max: 100,
				icon: '📄',
				text: 'Medium (${value} words)',
				color: '#F59E0B',
			},
			{
				min: 100,
				max: 200,
				icon: '📑',
				text: 'Long (${value} words)',
				color: '#EF4444',
			},
			{
				min: 200,
				max: 500,
				icon: '📰',
				text: 'Article (${value} words)',
				color: '#8B5CF6',
			},
			{
				min: 500,
				max: 1000,
				icon: '📚',
				text: 'Essay (${value} words)',
				color: '#EC4899',
			},
		],
		[]
	);

	// Handle range slider value changes (RangeSliderSpell)
	const handleRangeSliderChange = (value: number, optionIndex: number) => {
		// Update Cedar state
		const setCedarState = useCedarStore.getState().setCedarState;
		setCedarState('draftSliderState', {
			isActive: true,
			wordCount: value,
		});
	};

	// Handle original slider value changes (SliderSpell)
	const handleSliderChange = (value: number) => {
		// Update Cedar state
		const setCedarState = useCedarStore.getState().setCedarState;
		setCedarState('draftSliderState', {
			isActive: true,
			wordCount: value,
		});
	};

	// Handle range slider completion - uses rewriteDraftWorkflow with agent (RangeSliderSpell)
	const handleRangeSliderComplete = async (
		value: number,
		optionIndex: number
	) => {
		// Update Cedar state
		const setCedarState = useCedarStore.getState().setCedarState;
		setCedarState('draftSliderState', {
			isActive: false,
			wordCount: value,
		});

		// Get current compose draft if available
		const { composeData, isComposeOpen } = useEmailStore.getState();

		// Determine current draft source
		const currentDraft = {
			subject: composeData?.subject || '',
			body: composeData?.body || '',
		};

		// Only proceed if there's content to rewrite
		if (isComposeOpen) {
			// Get the selected option
			const selectedOption = wordCountOptions[optionIndex];
			const rangeName = selectedOption.text.replace(
				'${value}',
				value.toString()
			);

			// Call the rewrite workflow
			await rewriteDraftWorkflow({
				prompt: `Rewrite this email to match the target word count while maintaining the key message and appropriate tone for the ${rangeName} length.`,
				wordCount: value,
				currentDraft,
				rangeContext: {
					min: value - 10, // Approximate range
					max: value + 10,
					rangeName,
				},
			});
		} else {
			// No active draft to rewrite
		}
	};

	// Handle original slider completion - uses rewriteDraftWorkflow with agent (SliderSpell)
	const handleSliderComplete = async (value: number) => {
		// Update Cedar state
		const setCedarState = useCedarStore.getState().setCedarState;
		setCedarState('draftSliderState', {
			isActive: false,
			wordCount: value,
		});

		// Get current compose draft if available
		const { composeData, isComposeOpen } = useEmailStore.getState();

		// Determine current draft source
		const currentDraft = {
			subject: composeData?.subject || '',
			body: composeData?.body || '',
		};

		// Only proceed if there's content to rewrite
		if (isComposeOpen) {
			// Find the appropriate range context
			const range = wordCountRanges.find(
				(r) => value >= r.min && value <= r.max
			);
			const rangeName = range?.text
				? range.text.replace('${value}', value.toString())
				: `${value} words`;

			// Call the rewrite workflow
			await rewriteDraftWorkflow({
				prompt: `Rewrite this email to match the target word count while maintaining the key message and appropriate tone for the ${rangeName} length.`,
				wordCount: value,
				currentDraft,
				rangeContext: range
					? {
							min: range.min,
							max: range.max,
							rangeName,
						}
					: undefined,
			});
		} else {
			// No active draft to rewrite
		}
	};

	const radialMenu = (
		<RadialMenuSpell
			spellId='global-email-actions-menu'
			items={menuItems}
			activationConditions={activationConditions}
		/>
	);

	const draftLengthSlider = (
		<RangeSliderSpell
			spellId='email-draft-length-slider'
			activationConditions={{
				events: ['t'],
				mode: ActivationMode.HOLD,
			}}
			rangeSliderConfig={{
				options: wordCountOptions,
				unit: ' words',
				proportionalSpacing: false,
			}}
			onComplete={handleRangeSliderComplete}
			onChange={handleRangeSliderChange}
		/>
	);

	const originalDraftLengthSlider = (
		<SliderSpell
			spellId='email-draft-length-slider-original'
			activationConditions={{
				events: ['r'],
				mode: ActivationMode.HOLD,
			}}
			sliderConfig={{
				min: 5,
				max: 1000,
				step: 5,
				unit: ' words',
				ranges: wordCountRanges,
				label: 'Draft Length',
			}}
			onComplete={handleSliderComplete}
			onChange={handleSliderChange}
		/>
	);

	return { radialMenu, draftLengthSlider, originalDraftLengthSlider };
}

export default useSmailCedarSpells;
