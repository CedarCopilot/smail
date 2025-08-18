'use client';

import React, { useMemo } from 'react';
import { cn } from 'cedar-os';

interface PhantomTextProps {
	/** Number of words to generate */
	wordCount: number;
	/** Optional CSS classes */
	className?: string;
	/** Optional inline styles */
	style?: React.CSSProperties;
	/** Whether to wrap text in a paragraph element */
	asParagraph?: boolean;
	/** Custom word pool for generating text */
	customWords?: string[];
	/** Whether to format as email (default: true) */
	asEmail?: boolean;
}

// Default word pool for generating placeholder text
const DEFAULT_WORD_POOL = [
	'lorem',
	'ipsum',
	'dolor',
	'sit',
	'amet',
	'consectetur',
	'adipiscing',
	'elit',
	'sed',
	'do',
	'eiusmod',
	'tempor',
	'incididunt',
	'ut',
	'labore',
	'et',
	'dolore',
	'magna',
	'aliqua',
	'enim',
	'ad',
	'minim',
	'veniam',
	'quis',
	'nostrud',
	'exercitation',
	'ullamco',
	'laboris',
	'nisi',
	'aliquip',
	'ex',
	'ea',
	'commodo',
	'consequat',
	'duis',
	'aute',
	'irure',
	'in',
	'reprehenderit',
	'voluptate',
	'velit',
	'esse',
	'cillum',
	'fugiat',
	'nulla',
	'pariatur',
	'excepteur',
	'sint',
	'occaecat',
	'cupidatat',
	'non',
	'proident',
	'sunt',
	'culpa',
	'qui',
	'officia',
	'deserunt',
	'mollit',
	'anim',
	'id',
	'est',
	'laborum',
	'perspiciatis',
	'unde',
	'omnis',
	'iste',
	'natus',
	'error',
	'voluptatem',
	'accusantium',
	'doloremque',
	'laudantium',
	'totam',
	'rem',
	'aperiam',
	'eaque',
	'ipsa',
	'quae',
	'ab',
	'illo',
	'inventore',
	'veritatis',
	'quasi',
	'architecto',
	'beatae',
	'vitae',
	'dicta',
	'explicabo',
	'nemo',
	'enim',
	'ipsam',
	'quia',
	'voluptas',
	'aspernatur',
	'aut',
	'odit',
	'fugit',
	'consequuntur',
	'magni',
	'dolores',
	'eos',
	'ratione',
	'sequi',
	'nesciunt',
	'neque',
	'porro',
	'quisquam',
	'dolorem',
	'adipisci',
	'numquam',
	'eius',
	'modi',
	'tempora',
	'incidunt',
	'magnam',
	'quaerat',
	'etiam',
	'nihil',
	'molestiae',
	'consequatur',
	'vel',
	'illum',
	'odio',
	'dignissimos',
	'ducimus',
	'blanditiis',
	'praesentium',
	'voluptatum',
	'deleniti',
	'atque',
	'corrupti',
	'quos',
	'quas',
	'molestias',
	'excepturi',
	'obcaecati',
	'cupiditate',
	'provident',
	'similique',
	'mollitia',
	'animi',
	'dolorum',
	'fuga',
	'harum',
	'quidem',
	'rerum',
	'facilis',
	'expedita',
	'distinctio',
	'nam',
	'libero',
	'tempore',
	'cum',
	'soluta',
	'nobis',
	'eligendi',
	'optio',
	'cumque',
	'impedit',
	'quo',
	'minus',
	'quod',
	'maxime',
	'placeat',
	'facere',
	'possimus',
	'assumenda',
	'repellendus',
	'temporibus',
	'autem',
	'quibusdam',
	'officiis',
	'debitis',
	'reiciendis',
	'voluptatibus',
	'maiores',
	'alias',
	'perferendis',
	'doloribus',
	'asperiores',
	'repellat',
];

// Email-specific greetings and closings
const EMAIL_GREETINGS = [
	'Hi',
	'Hello',
	'Dear',
	'Good morning',
	'Good afternoon',
	"Hope you're well",
	'I hope this email finds you well',
];

const EMAIL_CLOSINGS = [
	'Best regards',
	'Thank you',
	'Looking forward to hearing from you',
	'Please let me know if you have any questions',
	'Thanks again',
	'Best',
	'Sincerely',
];

const EMAIL_TRANSITIONS = [
	'I wanted to follow up on',
	"I'm writing to",
	'I hope you can help me with',
	"I'd like to discuss",
	'Could you please',
	'I was wondering if',
	'Just wanted to check in about',
];

/**
 * PhantomText Component
 *
 * Generates placeholder text with a specified word count.
 * Useful for prototyping, testing layouts, or creating demo content.
 *
 * @example
 * ```tsx
 * // Generate 50 words of placeholder text
 * <PhantomText wordCount={50} />
 *
 * // With custom styling
 * <PhantomText wordCount={100} className="text-gray-500 italic" />
 *
 * // With custom word pool
 * <PhantomText
 *   wordCount={30}
 *   customWords={['hello', 'world', 'react', 'component']}
 * />
 *
 * // As regular text instead of email format
 * <PhantomText wordCount={50} asEmail={false} />
 * ```
 */
export const PhantomText: React.FC<PhantomTextProps> = ({
	wordCount,
	className = '',
	style,
	asParagraph = false,
	customWords,
	asEmail = true,
}) => {
	// Generate the placeholder text
	const phantomText = useMemo(() => {
		if (wordCount <= 0) return '';

		const wordPool =
			customWords && customWords.length > 0 ? customWords : DEFAULT_WORD_POOL;

		if (!asEmail) {
			// Original blob text generation
			const words: string[] = [];
			let sentenceWordCount = 0;
			let isNewSentence = true;

			for (let i = 0; i < wordCount; i++) {
				// Pick a random word from the pool
				const randomIndex = Math.floor(Math.random() * wordPool.length);
				let word = wordPool[randomIndex];

				// Capitalize first word of sentence
				if (isNewSentence) {
					word = word.charAt(0).toUpperCase() + word.slice(1);
					isNewSentence = false;
				}

				words.push(word);
				sentenceWordCount++;

				// Randomly end sentences (average sentence length ~12 words)
				const shouldEndSentence =
					sentenceWordCount >= 5 &&
					(sentenceWordCount >= 20 || Math.random() < 0.15);

				if (shouldEndSentence && i < wordCount - 1) {
					// Add punctuation
					const punctuation =
						Math.random() < 0.9 ? '.' : Math.random() < 0.5 ? '?' : '!';
					words[words.length - 1] += punctuation;
					sentenceWordCount = 0;
					isNewSentence = true;
				}

				// Add comma occasionally for natural flow
				if (
					!isNewSentence &&
					sentenceWordCount > 3 &&
					sentenceWordCount < 15 &&
					Math.random() < 0.1 &&
					i < wordCount - 1
				) {
					words[words.length - 1] += ',';
				}
			}

			// Ensure the text ends with punctuation
			const lastWord = words[words.length - 1];
			if (lastWord && !lastWord.match(/[.!?]$/)) {
				words[words.length - 1] += '.';
			}

			return words.join(' ');
		}

		// Email-formatted text generation
		const sections: string[] = [];
		let remainingWords = wordCount;

		// Add greeting (2-4 words)
		if (remainingWords > 10) {
			const greeting =
				EMAIL_GREETINGS[Math.floor(Math.random() * EMAIL_GREETINGS.length)];
			sections.push(greeting + ',\n');
			remainingWords -= greeting.split(' ').length;
		}

		// Add opening line (8-15 words)
		if (remainingWords > 20) {
			const transition =
				EMAIL_TRANSITIONS[Math.floor(Math.random() * EMAIL_TRANSITIONS.length)];
			const openingWords = Math.min(
				15,
				Math.max(8, Math.floor(remainingWords * 0.2))
			);
			const openingText = generateSentence(
				wordPool,
				openingWords - transition.split(' ').length
			);
			sections.push(transition + ' ' + openingText + '.\n\n');
			remainingWords -= openingWords;
		}

		// Generate paragraphs for remaining words
		while (remainingWords > 15) {
			const paragraphLength = Math.min(
				remainingWords - 10,
				Math.max(15, Math.floor(remainingWords * 0.4))
			);
			const paragraph = generateParagraph(wordPool, paragraphLength);
			sections.push(paragraph + '\n\n');
			remainingWords -= paragraphLength;
		}

		// Add closing if we have words left
		if (remainingWords > 0) {
			const closing =
				EMAIL_CLOSINGS[Math.floor(Math.random() * EMAIL_CLOSINGS.length)];
			const closingWords = closing.split(' ').length;

			if (remainingWords >= closingWords) {
				sections.push(closing + '.');
				remainingWords -= closingWords;
			}

			// Use any remaining words for a short final sentence
			if (remainingWords > 0) {
				const finalText = generateSentence(wordPool, remainingWords);
				const lastSectionIndex = sections.length - 1;

				// Ensure we have a valid last section to modify
				if (
					lastSectionIndex >= 0 &&
					sections[lastSectionIndex] &&
					typeof sections[lastSectionIndex] === 'string'
				) {
					sections[lastSectionIndex] = sections[lastSectionIndex].replace(
						'.',
						', ' + finalText + '.'
					);
				} else {
					// If no valid last section, just add as a new section
					sections.push(finalText + '.');
				}
			}
		}

		return sections.join('').trim();
	}, [wordCount, customWords, asEmail]);

	const Wrapper = asParagraph ? 'p' : 'div';

	return (
		<Wrapper
			className={cn('phantom-text', className)}
			style={{
				...style,
				whiteSpace: asEmail ? 'pre-line' : 'normal',
			}}
			data-word-count={wordCount}>
			{phantomText}
		</Wrapper>
	);
};

// Helper function to generate a sentence with specific word count
function generateSentence(wordPool: string[], targetWords: number): string {
	if (targetWords <= 0) return '';

	const words: string[] = [];

	for (let i = 0; i < targetWords; i++) {
		const randomIndex = Math.floor(Math.random() * wordPool.length);
		let word = wordPool[randomIndex];

		// Capitalize first word
		if (i === 0) {
			word = word.charAt(0).toUpperCase() + word.slice(1);
		}

		words.push(word);

		// Add comma occasionally for natural flow
		if (i > 2 && i < targetWords - 1 && Math.random() < 0.15) {
			words[words.length - 1] += ',';
		}
	}

	return words.join(' ');
}

// Helper function to generate a paragraph with multiple sentences
function generateParagraph(wordPool: string[], targetWords: number): string {
	if (targetWords <= 0) return '';

	const sentences: string[] = [];
	let remainingWords = targetWords;

	while (remainingWords > 0) {
		// Generate sentences of 6-15 words
		const sentenceLength = Math.min(
			remainingWords,
			Math.max(6, Math.floor(Math.random() * 10) + 6)
		);
		const sentence = generateSentence(wordPool, sentenceLength);
		sentences.push(sentence + '.');
		remainingWords -= sentenceLength;
	}

	return sentences.join(' ');
}

export default PhantomText;
