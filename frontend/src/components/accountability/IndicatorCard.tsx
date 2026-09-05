/**
 * One indicator's result, the way the Dashboard shows it.
 *
 * The performance colour is carried by the state's own gauge, because that is
 * the picture a reader arrives already knowing how to read.
 *
 * The trend is a coloured pill rather than coloured text because "Up" is the
 * good outcome for five indicators and the bad one for the other two — a
 * rising suspension rate is not good news — and that distinction has to
 * survive a glance.
 */
import { HelpCircleIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'

import { IndicatorGauge } from '@/components/accountability/IndicatorGauge'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { IndicatorResult } from '@/lib/client'
import {
	CHANGE_TONES,
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
	const change = describeChange(result.change, lowerIsBetter)
	const missingColor = explainMissingColor(result)

	/**
	 * Where there is no prior year, the missing colour and the missing change
	 * are the same fact told twice — the state needs two years for either. So
	 * that explanation hangs off the "No prior year" pill instead of taking a
	 * line of its own, and only the explanations that say something the pill
	 * does not stay on the card.
	 */
	const changeReason = change.direction === 'none' ? missingColor : null

	/** English Learner Progress is the one the state reports this way. */
	const groupNote =
		result.studentGroupCode === 'ALL'
			? null
			: `Reported for ${
					result.studentGroupCode === 'EL' ? 'English learners' : result.studentGroupCode
				} only`

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
			<CardContent className='space-y-3 '>
				{/* The gauge carries the state's rating, and names it in its alt
				    text, so a reader who cannot see it loses nothing. */}
				<IndicatorGauge color={result.color} />
				<div className='flex items-start justify-between gap-2'>
					<h3 className='text-sm font-medium leading-tight text-center w-full'>
						{result.indicatorName}
						{groupNote ? (
							// Which students an indicator covers qualifies its title, so
							// the mark sits against the title rather than a line below
							// the figure it does not describe.
							<Tooltip>
								<TooltipTrigger
									render={
										<span className='ml-1 inline-flex translate-y-0.5 cursor-help align-baseline text-muted-foreground' />
									}
								>
									<HugeiconsIcon icon={HelpCircleIcon} className='h-3.5 w-3.5' />
									<span className='sr-only'>{groupNote}</span>
								</TooltipTrigger>
								<TooltipContent className='max-w-72 items-start text-left'>
									<span>{groupNote}</span>
								</TooltipContent>
							</Tooltip>
						) : null}
					</h3>
					{result.isProjected ? (
						<Badge variant='outline' className='shrink-0 border-dashed'>
							Projected
						</Badge>
					) : null}
				</div>
				<div className='flex gap-4'>
					<p className='text-2xl font-semibold tabular-nums'>
						{formatStatus(result.currStatus, unit)}
					</p>

					<div className='flex flex-wrap items-center gap-1.5 text-xs'>
						{changeReason ? (
							// The pill already says there is no change to report; why the
							// state drew no conclusion from that is the second sentence, and
							// it belongs behind the first rather than under the card.
							<Tooltip>
								<TooltipTrigger
									render={
										<span
											className={cn(
												'cursor-help rounded-full px-2 py-0.5 font-medium tabular-nums',
												CHANGE_TONES[change.direction],
											)}
										/>
									}
								>
									{change.label}
								</TooltipTrigger>
								<TooltipContent className='max-w-72 items-start text-left'>
									<span>{changeReason}</span>
								</TooltipContent>
							</Tooltip>
						) : (
							<span
								className={cn(
									'rounded-full px-2 py-0.5 font-medium tabular-nums',
									CHANGE_TONES[change.direction],
								)}
							>
								{change.label}
							</span>
						)}
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
				</div>
				{missingColor && !changeReason ? (
					<p className='text-xs text-muted-foreground'>{missingColor}</p>
				) : null}
			</CardContent>
		</Card>
	)
}
