import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Suspense, useCallback, useState } from 'react'
import { z } from 'zod'

import { IndicatorDetailModal } from '@/components/Dashboard/detail/IndicatorDetailModal'
import { IndicatorGrid, IndicatorGridSkeleton } from '@/components/Dashboard/IndicatorGrid'
import NavbarD52 from '@/components/ui/navbar/NavbarD52'
import { STATEWIDE_CDS, type IndicatorCode } from '@/lib/constants/indicators'
import ScrollReset from '@/lib/hooks/ScrollReset'
import { useDashboardSummarySuspense } from '@/lib/hooks/useDashboardData'
import { useLastViewedSchool, getLastViewedCdsFromStorage } from '@/lib/hooks/useLastViewedSchool'

const searchSchema = z.object({
	q: z.coerce.string().optional(),
})

export const Route = createFileRoute('/dashboard/')({
	component: DashboardPage,
	validateSearch: searchSchema,
})

function DashboardContent({
	cds,
	onIndicatorClick,
}: {
	cds: string
	onIndicatorClick: (code: IndicatorCode) => void
}) {
	const { data } = useDashboardSummarySuspense(cds)

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

function DashboardPage() {
	const { q } = Route.useSearch()
	const navigate = useNavigate()

	// Get last viewed school, default to statewide
	const { cds: lastViewedCds, setLastViewedSchool } = useLastViewedSchool()

	// Use URL param if provided, otherwise use last viewed or statewide
	const effectiveCds = q || lastViewedCds || STATEWIDE_CDS

	// Modal state
	const [selectedIndicator, setSelectedIndicator] = useState<IndicatorCode | null>(null)

	// Handle indicator click
	const handleIndicatorClick = useCallback((code: IndicatorCode) => {
		setSelectedIndicator(code)
	}, [])

	// Close modal
	const handleCloseModal = useCallback(() => {
		setSelectedIndicator(null)
	}, [])

	// Find the selected indicator data for the modal
	// This will be passed from the parent component

	return (
		<div className='min-h-screen bg-[#f3f4fa]'>
			<ScrollReset />
			<NavbarD52 shadow />
			<div className='mx-auto max-w-7xl px-4 py-8'>
				<Suspense fallback={<DashboardSkeleton />}>
					<DashboardContent cds={effectiveCds} onIndicatorClick={handleIndicatorClick} />
				</Suspense>

				{/* Indicator Detail Modal - shown when an indicator is selected */}
				<Suspense fallback={null}>
					<IndicatorDetailModalWrapper
						cds={effectiveCds}
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
	selectedIndicator,
	onClose,
}: {
	cds: string
	selectedIndicator: IndicatorCode | null
	onClose: () => void
}) {
	// Fetch data only when modal is open
	const { data } = useDashboardSummarySuspense(cds)

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
