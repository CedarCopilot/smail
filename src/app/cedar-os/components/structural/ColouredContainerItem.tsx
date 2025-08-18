'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Code2, ArrowUpRight } from 'lucide-react';
import { itemVariants } from './animationVariants';
import { type ColorVariant } from './ColouredContainer';

interface ColouredContainerItemProps {
	title: string;
	icon?: React.ComponentType<{ className?: string }>;
	linkHref?: string;
	linkText?: string;
	children: React.ReactNode;
	color?: ColorVariant;
}

const getIconColorClass = (color: ColorVariant = 'blue') => {
	switch (color) {
		case 'green':
			return 'text-green-500';
		case 'purple':
			return 'text-purple-500';
		case 'blue':
		default:
			return 'text-blue-500';
	}
};

const getIconBgClass = (color: ColorVariant = 'blue') => {
	switch (color) {
		case 'green':
			return 'bg-green-500/10';
		case 'purple':
			return 'bg-purple-500/10';
		case 'blue':
		default:
			return 'bg-blue-500/10';
	}
};

export default function ColouredContainerItem({
	title,
	icon: Icon = Code2,
	linkHref,
	linkText,
	children,
	color = 'blue',
}: ColouredContainerItemProps) {
	return (
		<>
			<motion.div
				variants={itemVariants}
				className='flex items-center justify-between mb-2'>
				<div className='flex items-center gap-3'>
					<div
						className={`rounded-2xl ${getIconBgClass(color)} backdrop-blur-sm`}>
						<Icon className={`w-6 h-6 ${getIconColorClass(color)}`} />
					</div>
					<h3 className='text-lg font-bold'>{title}</h3>
				</div>
				{linkHref && linkText && (
					<Link
						href={linkHref}
						target='_blank'
						rel='noopener noreferrer'
						className='flex items-center gap-2 px-3 py-2 rounded-full bg-background/50 backdrop-blur-sm hover:bg-background/80 transition-colors text-sm font-medium'>
						<span>{linkText}</span>
						<ArrowUpRight className='w-4 h-4' />
					</Link>
				)}
			</motion.div>

			<motion.div
				variants={itemVariants}
				className='space-y-3 text-muted-foreground'>
				{children}
			</motion.div>
		</>
	);
}
