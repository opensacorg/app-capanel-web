/**
 * The accountability report — the layer caschooldashboard.org actually shows.
 *
 * Where /dashboard reports what students scored, this reports how the state
 * judged a school: one performance colour per indicator, the student groups
 * beneath it, and the history behind it.
 *
 * Five of the seven indicators here (chronic absenteeism, suspension,
 * graduation, college/career, English learner progress) have no assessment
 * source at all — they come from the state's own Dashboard files.
 *
 * The selection lives in the URL, so any view of this report is a link.
 *
 * On loading. The catalogue endpoint is slow and everything else on the page
 * used to wait behind it, so a cold visit spent a quarter of a minute looking
 * at three grey rectangles. Two things changed. The catalogue now arrives as
 * an assumption first (see `accountabilityShape`), which lets every other
 * request leave immediately and lets this page draw its real structure — its
 * indicator names, its filters, its tables, its prose — before a single figure
 * is known. And a wait long enough to look broken now says why it is long,
 * because the long case is a dataset being read for the first time, not a
 * fault. What is never assumed is a measured value: those stay skeletons.
 */
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMemo } from 'react'
import { z } from 'zod'

import { CompositionPanel } from '@/components/accountability/CompositionPanel'
import { GrowthPanel } from '@/components/accountability/GrowthPanel'
import { IndicatorCard } from '@/components/accountability/IndicatorCard'
import { IndicatorTrend } from '@/components/accountability/IndicatorTrend'
import {
	IndicatorGridPlaceholder,
	StudentGroupTablePlaceholder,
} from '@/components/accountability/Placeholders'
import { StudentGroupBreakdown } from '@/components/accountability/StudentGroupBreakdown'
import NavbarD52 from '@/components/common/navbar/navbar-D52'
import { SlowLoadNotice } from '@/components/common/status/SlowLoadNotice'
import { LocalMeasures } from '@/components/local-indicators/LocalMeasures'
import { EntityPicker } from '@/components/results/EntityPicker'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { EntityPublic } from '@/lib/client'
import {
	type AccountabilitySelection,
	ALL_STUDENTS,
	dashboardCatalogQuery,
	formatSchoolYear,
	indicatorGroupsQuery,
	indicatorsQuery,
	STATEWIDE_CDS,
} from '@/lib/services/accountability'
import { assumedCatalog, assumedIndicator } from '@/lib/services/accountabilityShape'
import { entityQuery } from '@/lib/services/assessments'
import ScrollReset from '@/routes/-hooks/hooks/ScrollReset'
import { useSlowLoad } from '@/routes/-hooks/hooks/useSlowLoad'

/**
 * The router parses search values as JSON, so a CDS code that looks like a
 * number comes back as one. It is a code, not a quantity, so it is coerced
 * back to a string here.
 */
const searchSchema = z.object({
	cds: z.coerce.string().length(14).default(STATEWIDE_CDS),
	year: z.coerce.number().int().optional(),
	studentGroup: z.coerce.string().default(ALL_STUDENTS),
	indicator: z.coerce.string().optional(),
})

export const Route = createFileRoute('/accountability/')({
	validateSearch: searchSchema,
	component: AccountabilityPage,
})

function AccountabilityPage() {
	const search = Route.useSearch()
	const navigate = useNavigate({ from: Route.fullPath })

	const catalog = useQuery(dashboardCatalogQuery(search.year))
	const ancestry = useQuery(entityQuery(search.cds))

	/**
	 * Never undefined: the query carries a placeholder, and a catalogue that
	 * failed outright still leaves the page a shape to draw. `assumed` is what
	 * separates the two, and it gates everything that would read as a fact.
	 */
	const reference = catalog.data ?? assumedCatalog()
	const assumed = catalog.isPlaceholderData || catalog.isError

	/**
	 * A year the state never published cannot be shown. The projected year is
	 * one of those: it is served beside the last published year rather than as
	 * a year of its own, so a link that names it resolves to that year here,
	 * the same way the API resolves it.
	 *
	 * While the catalogue is only assumed there is no published list to check
	 * against, so a year named in the URL is taken at its word — the URL is the
	 * better evidence of the two. Once the real catalogue lands it is checked.
	 */
	const year =
		search.year && (assumed || reference.years.includes(search.year))
			? search.year
			: reference.reportingYear
	const selection: AccountabilitySelection = {
		cds: search.cds,
		year,
		studentGroup: search.studentGroup,
	}

	const indicators = useQuery(indicatorsQuery(selection))

	const entity = ancestry.data?.entity

	/**
	 * The API sorts results by the catalogue's own order, so the catalogue's
	 * first indicator is the one that will be selected when they arrive. Naming
	 * it now lets the breakdown below fetch alongside the grid rather than
	 * after it; if the entity does not report it, the real results correct the
	 * selection and the breakdown refetches.
	 */
	const selectedIndicator = useMemo(
		() =>
			search.indicator ?? indicators.data?.results[0]?.indicatorCode ?? assumedIndicator(reference),
		[search.indicator, indicators.data, reference],
	)

	const indicatorMeta = reference.indicators.find((item) => item.code === selectedIndicator)

	const groups = useQuery({
		...indicatorGroupsQuery(selection, selectedIndicator ?? ''),
		enabled: Boolean(selectedIndicator),
	})

	/**
	 * One wait, graded, covering both slow endpoints — a reader experiences the
	 * page filling in, not two requests. `isFetching` rather than `isPending`
	 * so a refetch over stale data is graded too: on this page that refetch is
	 * the recache, and it is exactly the case worth explaining.
	 */
	const loadStage = useSlowLoad(catalog.isFetching || indicators.isFetching || groups.isFetching)

	/** Base UI needs the value-to-label mapping to render the closed trigger. */
	const yearItems = useMemo(
		() =>
			reference.years.map((item) => ({
				value: String(item),
				label: formatSchoolYear(item),
			})),
		[reference],
	)

	const groupItems = useMemo(
		() =>
			reference.studentGroups.map((group) => ({
				value: group.code,
				label: group.name,
			})),
		[reference],
	)

	const groupNames = useMemo(
		() => Object.fromEntries(reference.studentGroups.map((group) => [group.code, group.name])),
		[reference],
	)

	const metaFor = (code: string) => reference.indicators.find((item) => item.code === code)

	/** The state publishes some measures alongside the seven without counting
	 *  them; they must not sit in the same grid. */
	const accountabilityResults = (indicators.data?.results ?? []).filter(
		(result) => !metaFor(result.indicatorCode)?.isInformational,
	)
	const informationalResults = (indicators.data?.results ?? []).filter(
		(result) => metaFor(result.indicatorCode)?.isInformational,
	)

	function update(next: Partial<z.infer<typeof searchSchema>>) {
		void navigate({ search: (previous) => ({ ...previous, ...next }) })
	}

	function chooseEntity(next: EntityPublic) {
		update({ cds: next.cdsCode })
	}

	/**
	 * Only the statewide code names itself without a lookup. Anything else has
	 * to be fetched, so its heading is a skeleton rather than a guess — a wrong
	 * school name is worse than no school name.
	 */
	const displayName = entity?.displayName ?? (search.cds === STATEWIDE_CDS ? 'California' : null)
	const ancestorLine =
		ancestry.data?.ancestors.map((item) => item.displayName).join(' · ') ||
		(ancestry.data || search.cds === STATEWIDE_CDS ? 'Statewide accountability' : null)

	/**
	 * Both halves failing means the Dashboard files were never imported, which
	 * is an operator's problem rather than a reader's — so it takes the whole
	 * page and says what to run. A catalogue that fails on its own is reported
	 * in place instead, and the report stands on the guess: waiting on the
	 * slower of the two before deciding would flash this page and then replace
	 * it, and a fresh install is the only case that wants it.
	 */
	if (catalog.isError && indicators.isError) {
		return (
			<>
				<NavbarD52 />
				<main className='mx-auto w-full max-w-6xl px-4 py-8'>
					<Alert variant='destructive'>
						<AlertTitle>No accountability data</AlertTitle>
						<AlertDescription>
							{catalog.error.message} Run <code>uv run app/scripts/ingest_dashboard_files.py</code>{' '}
							to load the state's Dashboard files.
						</AlertDescription>
					</Alert>
				</main>
			</>
		)
	}

	return (
		<>
			<ScrollReset />
			<NavbarD52 />
			<main className='mx-auto w-full max-w-6xl space-y-8 px-4 py-8'>
				<header className='space-y-3'>
					<div className='space-y-1'>
						{displayName ? (
							<h1 className='text-2xl font-semibold tracking-tight'>{displayName}</h1>
						) : (
							<Skeleton className='h-8 w-80 max-w-full rounded-md' />
						)}
						{ancestorLine ? (
							<p className='text-sm text-muted-foreground'>{ancestorLine}</p>
						) : (
							<Skeleton className='h-4 w-56 max-w-full rounded-md' />
						)}
					</div>
					{/* Needs no data at all, so it is usable while everything else
					    loads — a reader who landed on the wrong school can leave. */}
					<div className='flex flex-wrap items-center gap-2'>
						<EntityPicker entity={entity} onSelect={chooseEntity} />
						{search.cds !== STATEWIDE_CDS ? (
							<Button variant='ghost' size='sm' onClick={() => update({ cds: STATEWIDE_CDS })}>
								Back to statewide
							</Button>
						) : null}
						{entity?.isCharter ? <Badge variant='outline'>Charter school</Badge> : null}
					</div>
				</header>

				<SlowLoadNotice stage={loadStage} subject='this accountability report' />

				{catalog.error ? (
					<Alert variant='destructive'>
						<AlertTitle>The filters may be out of date</AlertTitle>
						<AlertDescription>
							{catalog.error.message} The years and student groups below are the ones this browser
							last saw.
						</AlertDescription>
					</Alert>
				) : null}

				<Card>
					<CardContent className='grid gap-4 pt-6 sm:grid-cols-2'>
						<div className='space-y-1.5'>
							<Label htmlFor='accountability-year'>Year</Label>
							<Select
								items={yearItems}
								value={String(year)}
								onValueChange={(value) => update({ year: Number(value) })}
							>
								<SelectTrigger id='accountability-year' className='w-full'>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{yearItems.map((item) => (
										<SelectItem key={item.value} value={item.value}>
											{item.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className='space-y-1.5'>
							<Label htmlFor='accountability-group'>Student group</Label>
							<Select
								items={groupItems}
								value={search.studentGroup}
								onValueChange={(value) => value && update({ studentGroup: value })}
							>
								<SelectTrigger id='accountability-group' className='w-full'>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{groupItems.map((item) => (
										<SelectItem key={item.value} value={item.value}>
											{item.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</CardContent>
				</Card>

				{indicators.data?.projectionYear ? (
					<Alert>
						<AlertTitle>
							Where {formatSchoolYear(indicators.data.projectionYear)} is heading
						</AlertTitle>
						<AlertDescription>
							The state has not released that Dashboard yet, so it has no year of its own here.
							Where this application can estimate it, the projected change sits beside the published
							one as a second, grey figure. It was worked out from the underlying data using the
							state's published cut points and may differ from what the state eventually publishes.
						</AlertDescription>
					</Alert>
				) : null}

				{indicators.isPending ? (
					<IndicatorGridPlaceholder indicators={reference.indicators} />
				) : indicators.isError ? (
					<Alert variant='destructive'>
						<AlertDescription>{indicators.error.message}</AlertDescription>
					</Alert>
				) : indicators.data.results.length > 0 ? (
					<>
						<section className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
							{accountabilityResults.map((result) => (
								<IndicatorCard
									key={`${result.indicatorCode}-${result.studentGroupCode}`}
									result={result}
									unit={metaFor(result.indicatorCode)?.unit ?? 'percent'}
									lowerIsBetter={metaFor(result.indicatorCode)?.lowerIsBetter ?? false}
									selected={result.indicatorCode === selectedIndicator}
									onSelect={(code) => update({ indicator: code })}
								/>
							))}
						</section>

						{informationalResults.length > 0 ? (
							<section className='space-y-3'>
								<h2 className='text-sm font-medium text-muted-foreground'>
									Also published, for information
								</h2>
								<p className='text-sm text-muted-foreground'>
									Reported alongside the indicators above but not part of the accountability system,
									so these carry no performance colour.
								</p>
								<div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
									{informationalResults.map((result) => (
										<IndicatorCard
											key={`${result.indicatorCode}-${result.studentGroupCode}`}
											result={result}
											unit={metaFor(result.indicatorCode)?.unit ?? 'percent'}
											lowerIsBetter={metaFor(result.indicatorCode)?.lowerIsBetter ?? false}
											selected={result.indicatorCode === selectedIndicator}
											onSelect={(code) => update({ indicator: code })}
										/>
									))}
								</div>
							</section>
						) : null}
					</>
				) : (
					<Alert>
						<AlertTitle>Nothing reported</AlertTitle>
						<AlertDescription>
							The state reports no indicators for this entity, year and student group.
						</AlertDescription>
					</Alert>
				)}

				{selectedIndicator && indicatorMeta ? (
					<Card>
						<CardHeader>
							<CardTitle className='text-base'>{indicatorMeta.name}</CardTitle>
						</CardHeader>
						<CardContent>
							<Tabs defaultValue='groups'>
								<TabsList>
									<TabsTrigger value='groups'>Student groups</TabsTrigger>
									<TabsTrigger value='trend'>Over time</TabsTrigger>
								</TabsList>
								<TabsContent value='groups' className='pt-4'>
									{groups.isPending ? (
										<StudentGroupTablePlaceholder groups={reference.studentGroups} />
									) : groups.isError ? (
										<p className='text-sm text-destructive'>{groups.error.message}</p>
									) : (
										<StudentGroupBreakdown
											report={groups.data}
											unit={indicatorMeta.unit}
											lowerIsBetter={indicatorMeta.lowerIsBetter}
											groupNames={groupNames}
										/>
									)}
								</TabsContent>
								<TabsContent value='trend' className='pt-4'>
									<IndicatorTrend
										selection={selection}
										indicator={selectedIndicator}
										unit={indicatorMeta.unit}
									/>
								</TabsContent>
							</Tabs>
						</CardContent>
					</Card>
				) : null}

				<CompositionPanel cds={selection.cds} year={selection.year} />

				<GrowthPanel
					cds={selection.cds}
					year={selection.year}
					studentGroup={selection.studentGroup}
				/>

				<LocalMeasures cds={selection.cds} year={selection.year} />

				{/* Needs nothing loaded, and is the part of the page most likely to
				    answer the question a reader arrived with, so it is never held
				    back behind a request. */}
				<footer className='border-t pt-6 text-xs text-muted-foreground'>
					<p>
						Source: California Department of Education, California School Dashboard downloadable
						data files. Figures are reproduced as published. A group shown as{' '}
						<strong>Not rated</strong> either sits outside the accountability system (English
						learners only, reclassified, English only, and the assessment-type groups are reported
						for information), has fewer than 30 students, or has only one year of data.
					</p>
				</footer>
			</main>
		</>
	)
}
