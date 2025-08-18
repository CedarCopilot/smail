'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { containerVariants } from './animationVariants';

export type ColorVariant = 'blue' | 'green' | 'purple';

interface ColouredContainerProps {
	children: React.ReactNode;
	color?: ColorVariant;
	className?: string;
}

const getColorClasses = (color: ColorVariant) => {
	switch (color) {
		case 'green':
			return {
				container:
					'bg-gradient-to-br from-green-500/5 via-green-500/10 to-green-500/5 border border-green-500/20 hover:border-green-500/40',
				overlay: 'bg-gradient-to-br from-green-500/5 to-transparent',
			};
		case 'purple':
			return {
				container:
					'bg-gradient-to-br from-purple-500/5 via-purple-500/10 to-purple-500/5 border border-purple-500/20 hover:border-purple-500/40',
				overlay: 'bg-gradient-to-br from-purple-500/5 to-transparent',
			};
		case 'blue':
		default:
			return {
				container:
					'bg-gradient-to-br from-blue-500/5 via-blue-500/10 to-blue-500/5 border border-blue-500/20 hover:border-blue-500/40',
				overlay: 'bg-gradient-to-br from-blue-500/5 to-transparent',
			};
	}
};

export default function ColouredContainer({
	children,
	color = 'blue',
	className = '',
}: ColouredContainerProps) {
	const colorClasses = getColorClasses(color);

	return (
		<motion.div
			initial='hidden'
			animate='visible'
			exit='exit'
			variants={containerVariants}
			className={`group relative w-full p-2 rounded-lg ${colorClasses.container} transition-all duration-300 overflow-hidden ${className}`}>
			<div
				className={`absolute inset-0 ${colorClasses.overlay} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
			/>

			<div className='relative z-10'>{children}</div>
		</motion.div>
	);
}
