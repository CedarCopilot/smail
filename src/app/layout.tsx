'use client';

import { ReactNode, useMemo, useState, memo } from 'react';
import { CedarCopilot } from 'cedar-os';
import type { ProviderConfig, ActivationConditions } from 'cedar-os';
import { Hotkey, ActivationMode } from 'cedar-os';

import { Mail, Calendar, ThumbsDown, UserCheck, Heart } from 'lucide-react';
import { Header } from './layout/Header';
import { Sidebar } from './layout/Sidebar';
import { ComposeManager } from './drafts/ComposeManager';
import { usePathname } from 'next/navigation';
import { SidePanelCedarChat } from '@/app/cedar-os/components/chatComponents/SidePanelCedarChat';
import RadialMenuSpell from '@/app/cedar-os/components/spells/RadialMenuSpell';
import type { RadialMenuItem } from '@/app/cedar-os/components/spells/RadialMenuSpell';
import SliderSpell from '@/app/cedar-os/components/spells/SliderSpell';
import type { RangeMetadata } from '@/app/cedar-os/components/spells/SliderSpell';
import { useEmailStore } from './store/emailStore';
import { useRouter } from 'next/navigation';
import './globals.css';
import { messageRenderers } from '@/app/cedar-os/messageRenderers';
import { useCedarStore, useRegisterState } from 'cedar-os';
import { generateDraft, rewriteDraft } from '@/app/cedar-os/AIWorkflows';

function RootLayout({ children }: { children: ReactNode }) {
	const [sidebarOpen, setSidebarOpen] = useState(true);
	const pathname = usePathname();
	const router = useRouter();
	const { moveToTrash, openCompose } = useEmailStore();

	// Register slider state globally (once at the app level)
	useRegisterState<{ isActive: boolean; wordCount: number }>({
		key: 'draftSliderState',
		value: { isActive: false, wordCount: 50 },
	});

	const isDetailRoute = useMemo(
		() => pathname?.includes('/inbox/') && pathname !== '/inbox',
		[pathname]
	);

	const llmProvider = useMemo<ProviderConfig>(
		() => ({
			provider: 'mastra',
			baseURL: process.env.NEXT_PUBLIC_MASTRA_URL || 'http://localhost:4112',
			apiKey: process.env.NEXT_PUBLIC_MASTRA_API_KEY,
			voiceRoute: '/voice',
		}),
		[]
	);

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

					// Generate draft using AI workflow
					const draft = await generateDraft({
						prompt: 'Generate a professional email to schedule a meeting',
						context: {
							recipientName: currentEmail?.from?.name,
							recipientEmail: currentEmail?.from?.email,
						},
					});

					// Open compose with the generated draft
					openCompose('new');
					// Update the compose data with the generated draft
					useEmailStore.getState().updateComposeData({
						subject: draft.subject,
						body: draft.body,
					});

					console.log('Generated meeting schedule draft:', draft);
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

					const draft = await generateDraft({
						prompt:
							'Generate a polite rejection email that declines an offer or request professionally',
						context: {
							recipientName: currentEmail?.from?.name,
							recipientEmail: currentEmail?.from?.email,
							originalEmail: currentEmail?.body,
						},
					});

					if (currentEmail) {
						openCompose('reply', currentEmail);
					} else {
						openCompose('new');
					}
					// Update the compose data with the generated draft
					useEmailStore.getState().updateComposeData({
						subject: draft.subject,
						body: draft.body,
					});

					console.log('Generated polite rejection draft:', draft);
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

					const draft = await generateDraft({
						prompt:
							'Generate a follow-up email to check on previous conversation or request',
						context: {
							recipientName: currentEmail?.from?.name,
							recipientEmail: currentEmail?.from?.email,
							originalEmail: currentEmail?.body,
						},
					});

					if (currentEmail) {
						openCompose('reply', currentEmail);
					} else {
						openCompose('new');
					}
					// Update the compose data with the generated draft
					useEmailStore.getState().updateComposeData({
						subject: draft.subject,
						body: draft.body,
					});

					console.log('Generated follow-up draft:', draft);
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

					const draft = await generateDraft({
						prompt:
							'Generate a thank you email expressing appreciation and gratitude',
						context: {
							recipientName: currentEmail?.from?.name,
							recipientEmail: currentEmail?.from?.email,
						},
					});

					// Open compose with the generated draft
					openCompose('new');
					// Update the compose data with the generated draft
					useEmailStore.getState().updateComposeData({
						subject: draft.subject,
						body: draft.body,
					});

					console.log('Generated thank you draft:', draft);
				},
			},
		],
		[pathname, openCompose]
	);

	// Activation conditions for 'g' key hold
	const activationConditions: ActivationConditions = useMemo(
		() => ({
			events: [Hotkey.G],
			mode: ActivationMode.HOLD,
		}),
		[]
	);

	// Define word count ranges with metadata for email drafts
	const wordCountRanges: RangeMetadata[] = useMemo(
		() => [
			{
				min: 5,
				max: 25,
				icon: '✍️',
				text: 'Brief (${value} words)',
				color: '#3B82F6', // blue
			},
			{
				min: 25,
				max: 50,
				icon: '📝',
				text: 'Short (${value} words)',
				color: '#10B981', // green
			},
			{
				min: 50,
				max: 100,
				icon: '📄',
				text: 'Medium (${value} words)',
				color: '#F59E0B', // amber
			},
			{
				min: 100,
				max: 200,
				icon: '📑',
				text: 'Long (${value} words)',
				color: '#EF4444', // red
			},
			{
				min: 200,
				max: 500,
				icon: '📰',
				text: 'Article (${value} words)',
				color: '#8B5CF6', // purple
			},
			{
				min: 500,
				max: 1000,
				icon: '📚',
				text: 'Essay (${value} words)',
				color: '#EC4899', // pink
			},
		],
		[]
	);

	// Handle slider value changes
	const handleSliderChange = (value: number) => {
		// Value is already the word count
		// Update Cedar state
		const setCedarState = useCedarStore.getState().setCedarState;
		setCedarState('draftSliderState', {
			isActive: true,
			wordCount: value,
		});
	};

	// Handle slider completion - now uses rewriteDraft workflow
	const handleSliderComplete = async (value: number) => {
		// Value is already the word count
		// Update Cedar state
		const setCedarState = useCedarStore.getState().setCedarState;
		setCedarState('draftSliderState', {
			isActive: false,
			wordCount: value,
		});

		// Get current compose draft if available
		const { composeData, isComposeOpen } = useEmailStore.getState();
		if (isComposeOpen && composeData) {
			// Rewrite the current draft with the target word count
			const rewrittenDraft = await rewriteDraft({
				prompt:
					'Rewrite this email to match the target word count while maintaining the key message',
				wordNum: value,
				originalDraft: {
					subject: composeData.subject || '',
					body: composeData.body || '',
				},
			});

			// Update the compose draft with the rewritten version
			useEmailStore.getState().updateComposeData({
				subject: rewrittenDraft.subject,
				body: rewrittenDraft.body,
			});

			console.log('Email draft rewritten:', rewrittenDraft);
		} else {
			console.log('No active draft to rewrite. Target word count:', value);
		}
	};

	return (
		<html lang='en'>
			<body>
				<CedarCopilot
					llmProvider={llmProvider}
					messageRenderers={messageRenderers}
					voiceSettings={{
						useBrowserTTS: false,
						stream: true,
					}}>
					<SidePanelCedarChat
						side='right'
						title='Email Assistant'
						collapsedLabel='Need help with your emails?'
						showCollapsedButton={true}
						companyLogo={<Mail className='w-6 h-6 text-blue-600' />}
						dimensions={{ width: 400, minWidth: 350, maxWidth: 600 }}
						resizable={true}
						className='z-50'>
						<div className='relative h-screen flex flex-col bg-white dark:bg-gray-900'>
							<Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
							<div className='relative flex-1 flex overflow-hidden'>
								<Sidebar isOpen={sidebarOpen} />
								<main className='flex-1 flex flex-col bg-gray-50 dark:bg-gray-950 p-2'>
									{children}
								</main>
							</div>
							{/* Always render compose manager but hide inline compose on detail routes */}
							<ComposeManager hideInlineCompose={isDetailRoute} />
						</div>
					</SidePanelCedarChat>

					{/* Global Radial Menu Spell */}
					<RadialMenuSpell
						spellId='global-email-actions-menu'
						items={menuItems}
						activationConditions={activationConditions}
					/>

					{/* Email Draft Length Slider Spell */}
					<SliderSpell
						spellId='email-draft-length-slider'
						activationConditions={{
							events: ['t'],
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
				</CedarCopilot>
			</body>
		</html>
	);
}
export default memo(RootLayout);
