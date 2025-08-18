export const llmProvider = {
	provider: 'mastra' as const,
	baseURL: process.env.NEXT_PUBLIC_MASTRA_URL || 'http://localhost:4112',
	apiKey: process.env.NEXT_PUBLIC_MASTRA_API_KEY,
	voiceRoute: '/voice',
};

export const voiceSettings = {
	useBrowserTTS: false,
	stream: true,
};
