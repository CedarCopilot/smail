// Animation variants for onboarding steps
// Based on the working StaggeredAnimationExample

import { Variants } from 'framer-motion';

// Container variants that handle staggering of children
export const containerVariants = {
	hidden: {},
	visible: {
		transition: {
			staggerChildren: 0.08,
			delayChildren: 0.2,
		},
	},
	exit: {
		transition: {},
	},
};

// Item variants for each child element
export const itemVariants: Variants = {
	hidden: {
		y: -10,
		opacity: 0,
	},
	visible: {
		y: 0,
		opacity: 1,
		transition: {
			duration: 0.3,
			ease: 'easeOut',
		},
	},
	exit: {
		opacity: 0,
		transition: { duration: 0.2, ease: 'easeOut' },
	},
	nonexistent: {
		opacity: 0,
		position: 'absolute',
		overflow: 'hidden',
	},
};
