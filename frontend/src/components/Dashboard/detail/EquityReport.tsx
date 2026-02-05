import { COLOR_LEVELS, getStudentGroupName } from '@/lib/constants/indicators'

interface ColorCounts {
	red: number
	orange: number
	yellow: number
	green: number
	blue: number
	none: number
}

interface EquityGroupSummary {
	studentgroup: string
	statuslevel: number | null
	color: number | null
	currdenom: number | null
}

interface EquityReportProps {
	colorCounts: ColorCounts
	groups: EquityGroupSummary[]
	showGroupList?: boolean
}

function ColorBar({ colorCounts }: { colorCounts: ColorCounts }) {
	const total =
		colorCounts.red + colorCounts.orange + colorCounts.yellow + colorCounts.green + colorCounts.blue

	if (total === 0) {
		return (
			<div className='flex h-8 w-full items-center justify-center rounded bg-gray-200 text-sm text-gray-500'>
				No student group data
			</div>
		)
	}

	const segments = [
		{ key: 'red', count: colorCounts.red, color: COLOR_LEVELS[1].color },
		{ key: 'orange', count: colorCounts.orange, color: COLOR_LEVELS[2].color },
		{ key: 'yellow', count: colorCounts.yellow, color: COLOR_LEVELS[3].color },
		{ key: 'green', count: colorCounts.green, color: COLOR_LEVELS[4].color },
		{ key: 'blue', count: colorCounts.blue, color: COLOR_LEVELS[5].color },
	].filter((s) => s.count > 0)

	return (
		<div className='space-y-2'>
			<div className='flex h-8 w-full overflow-hidden rounded'>
				{segments.map((segment) => (
					<div
						key={segment.key}
						className='flex items-center justify-center text-xs font-medium text-white transition-all'
						style={{
							width: `${(segment.count / total) * 100}%`,
							backgroundColor: segment.color,
						}}
					>
						{segment.count}
					</div>
				))}
			</div>
			<div className='flex flex-wrap justify-center gap-4 text-xs'>
				{segments.map((segment) => (
					<span key={segment.key} className='flex items-center gap-1'>
						<span className='h-3 w-3 rounded-full' style={{ backgroundColor: segment.color }} />
						{segment.key.charAt(0).toUpperCase() + segment.key.slice(1)}: {segment.count}
					</span>
				))}
			</div>
		</div>
	)
}

function GroupList({ groups }: { groups: EquityGroupSummary[] }) {
	// Sort groups by color level (red first, then orange, etc.)
	const sortedGroups = [...groups].sort((a, b) => {
		const colorA = a.color ?? 6
		const colorB = b.color ?? 6
		return colorA - colorB
	})

	return (
		<div className='space-y-2'>
			{sortedGroups.map((group) => {
				const colorInfo = COLOR_LEVELS[(group.color ?? 0) as keyof typeof COLOR_LEVELS]
				return (
					<div
						key={group.studentgroup}
						className='flex items-center justify-between rounded-lg border p-2'
					>
						<div className='flex items-center gap-2'>
							<span className='h-4 w-4 rounded-full' style={{ backgroundColor: colorInfo.color }} />
							<span className='font-medium'>{getStudentGroupName(group.studentgroup)}</span>
						</div>
						<div className='text-sm text-muted-foreground'>
							{group.currdenom?.toLocaleString() ?? 'N/A'} students
						</div>
					</div>
				)
			})}
		</div>
	)
}

export function EquityReport({ colorCounts, groups, showGroupList = true }: EquityReportProps) {
	return (
		<div className='space-y-4'>
			<div>
				<h4 className='mb-2 text-sm font-medium text-muted-foreground'>
					Student Group Performance Distribution
				</h4>
				<ColorBar colorCounts={colorCounts} />
			</div>

			{showGroupList && groups.length > 0 && (
				<div>
					<h4 className='mb-2 text-sm font-medium text-muted-foreground'>
						Student Groups ({groups.length})
					</h4>
					<GroupList groups={groups} />
				</div>
			)}
		</div>
	)
}

export function EquityReportSkeleton() {
	return (
		<div className='space-y-4'>
			<div>
				<div className='mb-2 h-4 w-48 animate-pulse rounded bg-muted/40' />
				<div className='h-8 w-full animate-pulse rounded bg-muted/40' />
			</div>
			<div>
				<div className='mb-2 h-4 w-32 animate-pulse rounded bg-muted/40' />
				<div className='space-y-2'>
					{Array.from({ length: 5 }).map((_, i) => (
						<div key={i} className='h-10 w-full animate-pulse rounded-lg bg-muted/40' />
					))}
				</div>
			</div>
		</div>
	)
}
