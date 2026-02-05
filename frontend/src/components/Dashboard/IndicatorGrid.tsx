import { INDICATOR_ORDER, type IndicatorCode } from '@/lib/constants/indicators'

import { IndicatorCard, IndicatorCardSkeleton } from './card/IndicatorCard'

interface IndicatorSummary {
	indicator: string
	currstatus: number | null
	priorstatus: number | null
	change: number | null
	statuslevel: number | null
	changelevel: number | null
	color: number | null
	currdenom: number | null
}

interface IndicatorGridProps {
	indicators: IndicatorSummary[]
	onIndicatorClick?: (code: IndicatorCode) => void
	compact?: boolean
	columns?: 1 | 2 | 4
}

export function IndicatorGrid({
	indicators,
	onIndicatorClick,
	compact = false,
	columns = 4,
}: IndicatorGridProps) {
	// Create a map for quick lookup
	const indicatorMap = new Map(indicators.map((ind) => [ind.indicator, ind]))

	// Sort indicators by the defined order
	const sortedIndicators = INDICATOR_ORDER.map((code) => {
		const ind = indicatorMap.get(code)
		if (ind) return ind
		// Return placeholder for missing indicators
		return {
			indicator: code,
			currstatus: null,
			priorstatus: null,
			change: null,
			statuslevel: null,
			changelevel: null,
			color: null,
			currdenom: null,
		}
	})

	const gridClasses = {
		1: 'grid-cols-1',
		2: 'grid-cols-1 sm:grid-cols-2',
		4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
	}

	return (
		<div className={`grid gap-4 ${gridClasses[columns]}`}>
			{sortedIndicators.map((ind) => (
				<IndicatorCard
					key={ind.indicator}
					indicator={ind}
					onClick={() => onIndicatorClick?.(ind.indicator as IndicatorCode)}
					compact={compact}
				/>
			))}
		</div>
	)
}

export function IndicatorGridSkeleton({
	compact = false,
	columns = 4,
	count = 8,
}: {
	compact?: boolean
	columns?: 1 | 2 | 4
	count?: number
}) {
	const gridClasses = {
		1: 'grid-cols-1',
		2: 'grid-cols-1 sm:grid-cols-2',
		4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
	}

	return (
		<div className={`grid gap-4 ${gridClasses[columns]}`}>
			{Array.from({ length: count }).map((_, i) => (
				<IndicatorCardSkeleton key={i} compact={compact} />
			))}
		</div>
	)
}
