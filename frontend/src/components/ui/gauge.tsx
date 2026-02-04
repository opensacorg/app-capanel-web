'use memo'

const LEVEL_LABELS = {
	0: 'No Data',
	1: 'Very Low',
	2: 'Low',
	3: 'Medium',
	4: 'High',
	5: 'Very High',
} as const

type PerformanceLevel = 0 | 1 | 2 | 3 | 4 | 5

interface GaugeProps {
	value: PerformanceLevel
	label?: string
	size?: number
	className?: string
}

/**
 * Gauge component using static SVG assets.
 * Displays a smooth rounded semicircle with an arrow pointing to the selected level.
 * Uses fade-in animation for transitions.
 */
export function Gauge({ value, label, size = 200, className = '' }: GaugeProps) {
	// Map value to SVG file path (0 defaults to showing level 1 in dimmed state)
	const svgPath = value === 0 ? '/gauge-1.svg' : `/gauge-${value}.svg`
	const svgHeight = size * 0.65

	return (
		<div className={`flex flex-col items-center justify-end gap-2 ${className}`}>
			<div
				className='relative flex justify-center overflow-hidden'
				style={{ height: svgHeight, width: size }}
			>
				{/* SVG Image with fade animation */}
				<img
					key={value}
					src={svgPath}
					alt={`Performance gauge showing ${LEVEL_LABELS[value]}`}
					width={size}
					height={svgHeight}
					className='animate-in fade-in duration-300'
					style={{
						opacity: value === 0 ? 0.4 : 1,
					}}
				/>

				{/* Label overlay */}
				<div className='absolute bottom-0 flex flex-col items-center pb-2'>
					<span className='px-3 py-1 text-sm font-bold uppercase tracking-wide rounded-full bg-white/90 shadow-sm transition-all duration-300'>
						{LEVEL_LABELS[value]}
					</span>
				</div>
			</div>

			{/* Description label */}
			{label && (
				<span className='text-center text-sm font-medium text-muted-foreground/80 max-w-[200px] leading-tight'>
					{label}
				</span>
			)}
		</div>
	)
}

/**
 * Skeleton matching the gauge dimensions.
 */
export function GaugeSkeleton({
	size = 200,
	className = '',
}: {
	size?: number
	className?: string
}) {
	return (
		<div className={`flex w-full flex-col items-center gap-2 ${className}`}>
			<div className='relative overflow-hidden' style={{ height: size * 0.65, width: size }}>
				<div
					className='absolute bottom-0 left-1/2 -translate-x-1/2 animate-pulse rounded-t-full bg-muted/40'
					style={{
						width: size * 0.9,
						height: size * 0.45,
					}}
				/>
			</div>
			<div className='h-4 w-28 animate-pulse rounded bg-muted/40' />
			<div className='h-3 w-40 animate-pulse rounded bg-muted/30' />
		</div>
	)
}
