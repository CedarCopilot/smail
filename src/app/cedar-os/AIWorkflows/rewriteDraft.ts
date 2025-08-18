/**
 * AI Workflow: Rewrite Email Draft
 *
 * This workflow rewrites an existing email draft based on a prompt and target word count.
 * Currently returns dummy data for development purposes.
 */

export interface RewriteDraftInput {
	prompt: string;
	wordNum: number;
	originalDraft?: {
		subject: string;
		body: string;
	};
	context?: {
		recipientEmail?: string;
		recipientName?: string;
		senderName?: string;
	};
}

export interface RewriteDraftOutput {
	subject: string;
	body: string;
	metadata?: {
		tone: string;
		wordCount: number;
		estimatedReadTime: string;
		changesSummary: string;
	};
}

/**
 * Rewrites an email draft based on the provided prompt and target word count
 * @param input - The prompt, word count target, and optional original draft
 * @returns A promise that resolves to the rewritten email draft
 */
export async function rewriteDraft(
	input: RewriteDraftInput
): Promise<RewriteDraftOutput> {
	// Simulate API delay
	await new Promise((resolve) => setTimeout(resolve, 1500));

	const { wordNum, prompt, originalDraft, context } = input;

	// Generate different versions based on word count
	let body: string;
	let tone: string;
	let changesSummary: string;

	if (wordNum <= 25) {
		// Very brief version
		body = `Hi ${context?.recipientName || 'there'},

Quick note: ${prompt || 'Following up on our discussion.'} Let me know your thoughts.

Thanks,
${context?.senderName || 'Your Name'}`;
		tone = 'brief';
		changesSummary = 'Condensed to essential points only';
	} else if (wordNum <= 50) {
		// Short version
		body = `Dear ${context?.recipientName || 'Colleague'},

I hope you're well. ${prompt || 'I wanted to reach out regarding our previous conversation.'}

Please let me know if you need any additional information or have questions. I'm available to discuss further at your convenience.

Best regards,
${context?.senderName || 'Your Name'}`;
		tone = 'concise';
		changesSummary = 'Shortened while maintaining key details';
	} else if (wordNum <= 100) {
		// Medium version
		body = `Dear ${context?.recipientName || 'Colleague'},

I hope this message finds you well. ${prompt || 'I wanted to follow up on our recent discussion and share some additional thoughts.'}

I believe this could be a great opportunity for us to collaborate and achieve our shared goals. I've given this considerable thought and would appreciate your perspective on how we might proceed.

Please let me know if you'd like to schedule a call to discuss this further. I'm flexible with timing and happy to work around your schedule.

Looking forward to your response.

Best regards,
${context?.senderName || 'Your Name'}`;
		tone = 'balanced';
		changesSummary = 'Expanded with context and details';
	} else if (wordNum <= 200) {
		// Long version
		body = `Dear ${context?.recipientName || 'Valued Colleague'},

I hope this email finds you in good spirits and that you're having a productive week.

${prompt || 'I wanted to take a moment to follow up on our previous conversation and expand upon some of the points we discussed.'}

After reflecting on our discussion, I've identified several key areas where I believe we can make significant progress. First, I think there's tremendous potential in the approach we outlined. Second, the timeline we discussed seems both realistic and achievable given our current resources and constraints.

I've also been considering potential challenges we might face and have some ideas for how we might address them proactively. I believe that with careful planning and coordination, we can navigate these successfully.

Would you be available for a more detailed discussion next week? I'm happy to prepare an agenda ahead of time to ensure we make the most of our time together. Please let me know what days and times work best for your schedule.

I'm excited about the possibilities ahead and look forward to continuing our collaboration.

Warm regards,
${context?.senderName || 'Your Name'}`;
		tone = 'detailed';
		changesSummary = 'Expanded with comprehensive details and context';
	} else {
		// Very long version (200+ words)
		body = `Dear ${context?.recipientName || 'Esteemed Colleague'},

I trust this message finds you well and that you're enjoying continued success in your endeavors.

${prompt || 'I wanted to reach out to follow up on our recent conversation and share some additional thoughts that have come to mind since we last spoke.'}

Upon further reflection, I've been giving considerable thought to the topics we discussed, and I believe there are several important points worth exploring in greater detail. The insights you shared during our conversation were particularly valuable and have helped shape my thinking on this matter.

First and foremost, I want to express my appreciation for your time and the thoughtful perspective you brought to our discussion. Your expertise in this area is evident, and I believe that by combining our respective strengths, we can achieve something truly remarkable.

Looking at the broader picture, I see numerous opportunities for synergy between our approaches. The framework you outlined aligns well with the objectives we're trying to achieve, and I'm confident that with some fine-tuning, we can develop a comprehensive strategy that addresses all key stakeholders' needs.

I've taken the liberty of outlining some preliminary thoughts on next steps, which I'd be happy to share with you in more detail. Additionally, I've identified some resources that might be helpful as we move forward with this initiative.

Would you be available for a follow-up discussion at your earliest convenience? I'm flexible with my schedule and can adjust to accommodate your availability. Perhaps we could set aside an hour to dive deeper into the specifics and establish a clear action plan.

Thank you once again for your collaboration and insights. I'm genuinely excited about the potential of what we're building together and look forward to our continued partnership.

With warm regards and best wishes,
${context?.senderName || 'Your Name'}`;
		tone = 'comprehensive';
		changesSummary =
			'Fully expanded with extensive detail and professional courtesy';
	}

	// Calculate actual word count (approximate)
	const actualWordCount = body.split(/\s+/).length;
	const readTime = Math.ceil(actualWordCount / 200); // Assuming 200 words per minute reading speed

	return {
		subject: originalDraft?.subject || 'Rewritten Email',
		body,
		metadata: {
			tone,
			wordCount: actualWordCount,
			estimatedReadTime: `${readTime} minute${readTime > 1 ? 's' : ''}`,
			changesSummary,
		},
	};
}
