/**
 * One indicator's result, the way the Dashboard shows it.
 *
 * The performance colour is carried by the bar across the top; the gauge that
 * reads it out sits elsewhere on the page, so the card does not name it twice.
 *
 * The trend is a coloured pill rather than coloured text because "Up" is the
 * good outcome for five indicators and the bad one for the other two — a
 * rising suspension rate is not good news — and that distinction has to
 * survive a glance.
 */
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { IndicatorResult } from '@/lib/client'
import {
	CHANGE_TONES,
	DASHBOARD_COLORS,
	describeChange,
	explainMissingColor,
	formatSchoolYear,
	formatStatus,
} from '@/lib/services/accountability'
import { cn } from '@/lib/utils'

export function IndicatorCard({
	result,
	unit,
	lowerIsBetter,
	selected = false,
	onSelect,
}: {
	result: IndicatorResult
	unit: string
	lowerIsBetter: boolean
	selected?: boolean
	onSelect?: (indicatorCode: string) => void
}) {
	const swatch = result.color ? DASHBOARD_COLORS[result.color] : undefined
	const change = describeChange(result.change, lowerIsBetter)
	const missingColor = explainMissingColor(result)

	const projection = result.projection
	const projected = projection ? describeChange(projection.change, lowerIsBetter) : undefined

	return (
		<Card
			className={cn(
				'relative overflow-hidden transition-colors',
				onSelect && 'cursor-pointer hover:border-foreground/30',
				selected && 'border-foreground/60 ring-1 ring-foreground/20',
			)}
			onClick={onSelect ? () => onSelect(result.indicatorCode) : undefined}
		>
			{/* The colour bar carries the state's rating; the level names travel
          with it in the gauge, so a reader who cannot see it loses nothing. */}
			<div
				aria-hidden
				className='h-2 w-full'
				style={{ backgroundColor: swatch?.token ?? 'var(--color-muted)' }}
			/>
			<CardContent className='space-y-3 pt-4'>
				<div className='flex items-start justify-between gap-2'>
					<h3 className='text-sm font-medium leading-tight'>{result.indicatorName}</h3>
					{result.isProjected ? (
						<Badge variant='outline' className='shrink-0 border-dashed'>
							Projected
						</Badge>
					) : null}
				</div>

				<p className='text-2xl font-semibold tabular-nums'>
					{formatStatus(result.currStatus, unit)}
				</p>

				<div className='flex flex-wrap items-center gap-1.5 text-xs'>
					<span
						className={cn(
							'rounded-full px-2 py-0.5 font-medium tabular-nums',
							CHANGE_TONES[change.direction],
						)}
					>
						{change.label}
					</span>
					{projection && projected ? (
						<Tooltip>
							{/* Dashed and grey rather than red or green: this figure is
							    this application's estimate, not the state's judgement. */}
							<TooltipTrigger
								render={
									<span className='cursor-help rounded-full border border-dashed border-muted-foreground/50 bg-muted px-2 py-0.5 font-medium tabular-nums text-muted-foreground' />
								}
							>
								{projected.label}
							</TooltipTrigger>
							<TooltipContent className='max-w-72 items-start text-left'>
								<span>
									{formatSchoolYear(projection.reportingYear)}: this application's estimate, not a
									state figure. It projects a {unit === 'percent' ? 'rate' : 'figure'} of{' '}
									{formatStatus(projection.currStatus, unit)}
									{projection.colorName ? `, in the ${projection.colorName} band` : ''}.{' '}
									{projection.basis ??
										'The state has not released the Dashboard for that year yet.'}
								</span>
							</TooltipContent>
						</Tooltip>
					) : null}
				</div>

				{result.studentGroupCode !== 'ALL' ? (
					<p className='text-xs text-muted-foreground'>
						Reported for{' '}
						{result.studentGroupCode === 'EL' ? 'English learners' : result.studentGroupCode} only
					</p>
				) : null}

				{missingColor ? <p className='text-xs text-muted-foreground'>{missingColor}</p> : null}
			</CardContent>
		</Card>
	)
}
