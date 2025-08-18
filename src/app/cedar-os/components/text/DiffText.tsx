import React, { useEffect } from 'react';
import { animate, motion, useMotionValue } from 'motion/react';
import { diffWords, diffChars } from 'diff';

// TypewriterText component for animated text appearance
const TypewriterText: React.FC<{
	text: string;
	color: string;
	backgroundColor: string;
}> = ({ text, color, backgroundColor }) => {
	const motionText = useMotionValue('');

	useEffect(() => {
		const animation = animate(0, text.length, {
			duration: Math.max(0.5, Math.min(1.5, text.length * 0.04)),
			ease: 'linear',
			onUpdate: (latest) => {
				motionText.set(text.slice(0, Math.ceil(latest)));
			},
		});

		return () => animation.stop();
	}, [text, motionText]);

	return (
		<motion.span
			className='relative'
			style={{
				backgroundColor,
				color,
				borderRadius: '2px',
				padding: '0 2px',
				textDecoration: 'none',
			}}>
			<motion.span style={{ whiteSpace: 'pre-wrap' }}>{motionText}</motion.span>
		</motion.span>
	);
};

// StrikethroughText component for removed text (no fade out)
const StrikethroughText: React.FC<{
	text: string;
}> = ({ text }) => {
	const strikethrough = useMotionValue(0);

	useEffect(() => {
		// Animate the strikethrough line
		const strikeAnimation = animate(strikethrough, 1, {
			duration: 0.3,
			ease: 'easeOut',
		});

		return () => {
			strikeAnimation.stop();
		};
	}, [strikethrough]);

	return (
		<motion.span
			className='relative inline-block'
			style={{
				backgroundColor: 'rgba(239, 68, 68, 0.2)',
				color: 'rgba(239, 68, 68, 0.9)',
				borderRadius: '2px',
				padding: '0 2px',
			}}>
			<span style={{ whiteSpace: 'pre-wrap' }}>{text}</span>
			<motion.div
				className='absolute top-1/2 left-0 right-0 h-[1px] bg-red-500'
				style={{
					scaleX: strikethrough,
					transformOrigin: 'left center',
					transform: 'translateY(-50%)',
				}}
			/>
		</motion.span>
	);
};

interface DiffTextProps {
	oldText: string;
	newText: string;
	diffMode?: 'words' | 'chars';
	showRemoved?: boolean;
	animateChanges?: boolean;
	className?: string;
}

export const DiffText: React.FC<DiffTextProps> = ({
	oldText,
	newText,
	diffMode = 'words',
	showRemoved = true,
	animateChanges = true,
	className = '',
}) => {
	// Use the appropriate diff function based on mode
	const diffFunction = diffMode === 'chars' ? diffChars : diffWords;
	const changes = diffFunction(oldText, newText);

	return (
		<span className={className}>
			{changes.map((part, index) => {
				if (part.added) {
					// Added text - green with typewriter effect
					return animateChanges ? (
						<TypewriterText
							key={`added-${index}`}
							text={part.value}
							color='rgb(34, 197, 94)'
							backgroundColor='rgba(34, 197, 94, 0.15)'
						/>
					) : (
						<span
							key={`added-${index}`}
							style={{
								backgroundColor: 'rgba(34, 197, 94, 0.15)',
								color: 'rgb(34, 197, 94)',
								borderRadius: '2px',
								padding: '0 2px',
							}}>
							{part.value}
						</span>
					);
				} else if (part.removed) {
					// Removed text - red with strikethrough (no fade)
					if (!showRemoved) return null;

					return animateChanges ? (
						<StrikethroughText key={`removed-${index}`} text={part.value} />
					) : (
						<span
							key={`removed-${index}`}
							style={{
								backgroundColor: 'rgba(239, 68, 68, 0.15)',
								color: 'rgba(239, 68, 68, 0.7)',
								borderRadius: '2px',
								padding: '0 2px',
								textDecoration: 'line-through',
							}}>
							{part.value}
						</span>
					);
				} else {
					// Unchanged text
					return <span key={`unchanged-${index}`}>{part.value}</span>;
				}
			})}
		</span>
	);
};

export default DiffText;
