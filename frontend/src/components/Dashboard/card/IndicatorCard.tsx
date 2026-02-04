import { FiArrowDown, FiArrowUp, FiMinus } from 'react-icons/fi'

import { Card, CardContent } from '@/components/ui/card'
import { Gauge } from '@/components/ui/gauge'
import { type IndicatorCode, INDICATORS, getColorInfo } from '@/lib/constants/indicators'

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

interface IndicatorCardProps {
	indicator: IndicatorSummary
	onClick?: () => void
	compact?: boolean
}

function formatStatus(value: number | null, indicator: string): string {
	if (value === null) return 'N/A'

	// For percentage-based indicators, show as percent
	if (['CHRONIC', 'SUSP', 'GRAD', 'ELPI', 'CCI'].includes(indicator)) {
		return `${value.toFixed(1)}%`
	}

	// For DFS (Distance from Standard) indicators
	return value.toFixed(1)
}

function ChangeIndicator({ change, indicator }: { change: number | null; indicator: string }) {
	if (change === null) {
		return (
			<span className='flex items-center gap-1 text-xs text-muted-foreground'>
				<FiMinus className='h-3 w-3' />
				<span>No change data</span>
			</span>
		)
	}

	// For inverted scale indicators (chronic, suspension), negative change is good
	const config = INDICATORS[indicator as IndicatorCode]
	const isInverted = config?.invertedScale ?? false

	const isPositive = isInverted ? change < 0 : change > 0
	const isNeutral = change === 0

	if (isNeutral) {
		return (
			<span className='flex items-center gap-1 text-xs text-muted-foreground'>
				<FiMinus className='h-3 w-3' />
				<span>No change</span>
			</span>
		)
	}

	return (
		<span
			className={`flex items-center gap-1 text-xs ${
				isPositive ? 'text-green-600' : 'text-red-600'
			}`}
		>
			{change > 0 ? <FiArrowUp className='h-3 w-3' /> : <FiArrowDown className='h-3 w-3' />}
			<span>
				{change > 0 ? '+' : ''}
				{change.toFixed(1)}
			</span>
		</span>
	)
}

export function IndicatorCard({ indicator, onClick, compact = false }: IndicatorCardProps) {
	const config = INDICATORS[indicator.indicator as IndicatorCode]
	const colorInfo = getColorInfo(indicator.color)
	const performanceLevel = (indicator.statuslevel ?? 0) as 0 | 1 | 2 | 3 | 4 | 5

	if (!config) {
		return null
	}

	const hasData = indicator.currstatus !== null || indicator.statuslevel !== null

	return (
		<Card
			className={`cursor-pointer transition-shadow hover:shadow-md ${!hasData ? 'opacity-60' : ''}`}
			onClick={onClick}
		>
			<CardContent className={compact ? 'p-3' : 'p-4'}>
				<div className='flex flex-col items-center gap-2'>
					{/* Indicator label */}
					<h3 className='text-sm font-medium text-muted-foreground'>{config.shortLabel}</h3>

					{/* Gauge */}
					<Gauge value={performanceLevel} size={compact ? 100 : 140} />

					{/* Status value */}
					<div className='text-center'>
						<p className='text-lg font-bold'>
							{formatStatus(indicator.currstatus, indicator.indicator)}
						</p>
						<ChangeIndicator change={indicator.change} indicator={indicator.indicator} />
					</div>

					{/* Student count */}
					{indicator.currdenom && !compact && (
						<p className='text-xs text-muted-foreground'>
							{indicator.currdenom.toLocaleString()} students
						</p>
					)}
				</div>
			</CardContent>
		</Card>
	)
}

export function IndicatorCardSkeleton({ compact = false }: { compact?: boolean }) {
	return (
		<Card>
			<CardContent className={compact ? 'p-3' : 'p-4'}>
				<div className='flex flex-col items-center gap-2'>
					<div className='h-4 w-16 animate-pulse rounded bg-muted/40' />
					<div
						className='animate-pulse rounded-t-full bg-muted/40'
						style={{
							width: compact ? 100 : 140,
							height: compact ? 65 : 91,
						}}
					/>
					<div className='h-6 w-12 animate-pulse rounded bg-muted/40' />
					<div className='h-3 w-20 animate-pulse rounded bg-muted/40' />
				</div>
			</CardContent>
		</Card>
	)
}
