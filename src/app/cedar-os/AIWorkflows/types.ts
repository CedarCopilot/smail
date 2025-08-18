export interface EmailWorkflowInput {
	prompt: string;
	context?: {
		recipientName?: string;
		recipientEmail?: string;
		originalEmail?: string;
	};
}

export interface RewriteDraftWorkflowInput {
	prompt: string;
	wordCount: number;
	currentDraft: {
		subject?: string;
		body?: string;
	};
	rangeContext?: {
		min: number;
		max: number;
		rangeName: string;
	};
}
