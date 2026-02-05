import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { Suspense, useCallback, useState } from 'react'
import { z } from 'zod'

import { ChevronLeft } from 'lucide-react'

import { IndicatorDetailModal } from '@/components/Dashboard/detail/IndicatorDetailModal'
import { IndicatorGrid, IndicatorGridSkeleton } from '@/components/Dashboard/IndicatorGrid'
import NavbarD52 from '@/components/ui/navbar/NavbarD52'
import { Button } from '@/components/ui/button'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { STATEWIDE_CDS, type IndicatorCode } from '@/lib/constants/indicators'
import ScrollReset from '@/lib/hooks/ScrollReset'
import { useDashboardSummarySuspense } from '@/lib/hooks/useDashboardData'
import { useLastViewedSchool } from '@/lib/hooks/useLastViewedSchool'

const AVAILABLE_YEARS = ['2025', '2024'] as const
type ReportingYear = (typeof AVAILABLE_YEARS)[number]

const searchSchema = z.object({
	q: z.coerce.string().optional(),
	year: z.coerce
		.string()
		.optional()
		.transform((val) => {
			if (val === '2024' || val === '2025') return val
			return undefined
		}),
})

export const Route = createFileRoute('/dashboard/')({
	component: DashboardPage,
	validateSearch: searchSchema,
})

function DashboardContent({
	cds,
	year,
	onIndicatorClick,
}: {
	cds: string
	year: ReportingYear
	onIndicatorClick: (code: IndicatorCode) => void
}) {
	const { data } = useDashboardSummarySuspense(cds, year)

	const entityName =
		data.schoolname ||
		data.districtname ||
		(cds === STATEWIDE_CDS ? 'California Statewide' : 'Unknown')

	return (
		<div className='space-y-6'>
			{/* Header */}
			<div>
				<h1 className='text-2xl font-bold text-gray-900'>{entityName}</h1>
				{data.countyname && cds !== STATEWIDE_CDS && (
					<p className='text-muted-foreground'>
						{data.districtname && data.schoolname
							? `${data.districtname} | ${data.countyname}`
							: data.countyname}
					</p>
				)}
				<p className='mt-1 text-sm text-muted-foreground'>
					{data.reportingyear} California School Dashboard
					{data.charter_flag === 'Y' && ' | Charter School'}
				</p>
			</div>

			{/* Indicator Grid */}
			<div>
				<h2 className='mb-4 text-lg font-semibold text-gray-800'>Accountability Indicators</h2>
				<IndicatorGrid indicators={data.indicators} onIndicatorClick={onIndicatorClick} />
			</div>
		</div>
	)
}

function YearSelector({
	value,
	onChange,
}: {
	value: ReportingYear
	onChange: (year: ReportingYear) => void
}) {
	return (
		<Select value={value} onValueChange={(val) => onChange(val as ReportingYear)}>
			<SelectTrigger className='w-[120px] bg-white'>
				<SelectValue />
			</SelectTrigger>
			<SelectContent>
				{AVAILABLE_YEARS.map((year) => (
					<SelectItem key={year} value={year}>
						{year}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	)
}

function DashboardPage() {
	const { q, year: urlYear } = Route.useSearch()
	const navigate = useNavigate()
	const router = useRouter()

	// Get last viewed school, default to statewide
	const { cds: lastViewedCds } = useLastViewedSchool()

	// Use URL param if provided, otherwise use last viewed or statewide
	const effectiveCds = q || lastViewedCds || STATEWIDE_CDS
	const effectiveYear: ReportingYear = urlYear || '2025'

	// Modal state
	const [selectedIndicator, setSelectedIndicator] = useState<IndicatorCode | null>(null)

	// Handle year change
	const handleYearChange = useCallback(
		(year: ReportingYear) => {
			navigate({
				to: '/dashboard/',
				search: (prev) => ({ ...prev, year }),
			})
		},
		[navigate],
	)

	// Handle indicator click
	const handleIndicatorClick = useCallback((code: IndicatorCode) => {
		setSelectedIndicator(code)
	}, [])

	// Close modal
	const handleCloseModal = useCallback(() => {
		setSelectedIndicator(null)
	}, [])

	return (
		<div className='min-h-screen bg-[#f3f4fa]'>
			<ScrollReset />
			<NavbarD52 shadow />
			<div className='mx-auto max-w-7xl px-4 py-8'>
				{/* Navigation and Year selector */}
				<div className='mb-6 flex items-center justify-between'>
					<Button
						variant='outline'
						size='sm'
						onClick={() => router.history.back()}
						className='gap-1 bg-white hover:bg-gray-100'
					>
						<ChevronLeft className='h-4 w-4' />
						Go back
					</Button>
					<div className='flex items-center gap-2'>
						<span className='text-sm text-muted-foreground'>Reporting Year:</span>
						<YearSelector value={effectiveYear} onChange={handleYearChange} />
					</div>
				</div>

				<Suspense fallback={<DashboardSkeleton />}>
					<DashboardContent
						cds={effectiveCds}
						year={effectiveYear}
						onIndicatorClick={handleIndicatorClick}
					/>
				</Suspense>

				{/* Indicator Detail Modal - shown when an indicator is selected */}
				<Suspense fallback={null}>
					<IndicatorDetailModalWrapper
						cds={effectiveCds}
						year={effectiveYear}
						selectedIndicator={selectedIndicator}
						onClose={handleCloseModal}
					/>
				</Suspense>
			</div>
		</div>
	)
}

function IndicatorDetailModalWrapper({
	cds,
	year,
	selectedIndicator,
	onClose,
}: {
	cds: string
	year: ReportingYear
	selectedIndicator: IndicatorCode | null
	onClose: () => void
}) {
	// Fetch data only when modal is open
	const { data } = useDashboardSummarySuspense(cds, year)

	if (!selectedIndicator || !data) {
		return null
	}

	const indicatorData = data.indicators.find((ind) => ind.indicator === selectedIndicator)

	return (
		<IndicatorDetailModal
			isOpen={!!selectedIndicator}
			onClose={onClose}
			cds={cds}
			indicator={indicatorData || null}
			reportingyear={data.reportingyear}
		/>
	)
}

function DashboardSkeleton() {
	return (
		<div className='space-y-6'>
			{/* Header skeleton */}
			<div>
				<div className='h-8 w-64 animate-pulse rounded bg-muted/40' />
				<div className='mt-2 h-4 w-48 animate-pulse rounded bg-muted/40' />
				<div className='mt-1 h-4 w-56 animate-pulse rounded bg-muted/40' />
			</div>

			{/* Title skeleton */}
			<div>
				<div className='mb-4 h-6 w-48 animate-pulse rounded bg-muted/40' />
				<IndicatorGridSkeleton />
			</div>
		</div>
	)
}
