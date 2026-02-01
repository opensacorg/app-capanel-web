import { createFileRoute, Link } from '@tanstack/react-router'
import { AlertOctagon, AlertTriangle, Bug, FileQuestion, Network, ShieldOff } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

export const Route = createFileRoute('/_status/error-demo')({
	component: ErrorDemoPage,
	head: () => ({
		meta: [{ title: 'Error States Demo' }],
	}),
})

const errorPages = [
	{
		code: '400',
		name: 'Bad Request',
		icon: AlertTriangle,
		path: '/status/bad-request',
		color: 'text-yellow-500',
	},
	{
		code: '401',
		name: 'Unauthorized',
		icon: ShieldOff,
		path: '/status/401',
		color: 'text-yellow-500',
	},
	{
		code: '403',
		name: 'Forbidden',
		icon: ShieldOff,
		path: '/status/403',
		color: 'text-destructive',
	},
	{
		code: '404',
		name: 'Not Found',
		icon: FileQuestion,
		path: '/status/404',
		color: 'text-destructive',
	},
	{
		code: '408',
		name: 'Timeout',
		icon: AlertTriangle,
		path: '/status/timeout',
		color: 'text-yellow-500',
	},
	{
		code: '409',
		name: 'Conflict',
		icon: AlertTriangle,
		path: '/status/conflict',
		color: 'text-yellow-500',
	},
	{
		code: '410',
		name: 'Gone',
		icon: FileQuestion,
		path: '/status/gone',
		color: 'text-muted-foreground',
	},
	{
		code: '415',
		name: 'Unsupported Media',
		icon: AlertTriangle,
		path: '/status/unsupported-media',
		color: 'text-destructive',
	},
	{
		code: '423',
		name: 'Locked',
		icon: ShieldOff,
		path: '/status/locked',
		color: 'text-destructive',
	},
	{
		code: '429',
		name: 'Rate Limited',
		icon: AlertTriangle,
		path: '/status/rate-limited',
		color: 'text-yellow-500',
	},
	{
		code: '500',
		name: 'Server Error',
		icon: AlertOctagon,
		path: '/status/500',
		color: 'text-destructive',
	},
	{
		code: '502',
		name: 'Bad Gateway',
		icon: Network,
		path: '/status/bad-gateway',
		color: 'text-destructive',
	},
	{
		code: '503',
		name: 'Unavailable',
		icon: Network,
		path: '/status/503',
		color: 'text-yellow-500',
	},
	{
		code: '504',
		name: 'Gateway Timeout',
		icon: Network,
		path: '/status/gateway-timeout',
		color: 'text-destructive',
	},
]

function ErrorDemoPage() {
	return (
		<div className='w-full max-w-4xl space-y-8'>
			<Card>
				<CardHeader className='text-center'>
					<div className='mx-auto mb-4'>
						<div className='rounded-full bg-destructive/10 p-4'>
							<Bug className='size-12 text-destructive' />
						</div>
					</div>
					<CardTitle className='text-3xl'>Error States</CardTitle>
					<CardDescription className='text-base'>
						HTTP error pages and error boundary components
					</CardDescription>
				</CardHeader>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className='text-lg'>HTTP Error Pages</CardTitle>
					<CardDescription>Standard HTTP status code pages</CardDescription>
				</CardHeader>
				<CardContent>
					<div className='grid gap-2 sm:grid-cols-2 md:grid-cols-3'>
						{errorPages.map((error) => {
							const Icon = error.icon
							return (
								<Link
									key={error.code}
									to={error.path}
									className='flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors'
								>
									<Icon className={`size-5 ${error.color}`} />
									<div>
										<div className='font-medium'>{error.code}</div>
										<div className='text-xs text-muted-foreground'>{error.name}</div>
									</div>
								</Link>
							)
						})}
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className='text-lg'>TanStack Error Integration</CardTitle>
					<CardDescription>How to use error components in your routes</CardDescription>
				</CardHeader>
				<CardContent className='space-y-4'>
					<div className='rounded-lg bg-muted p-4 font-mono text-xs overflow-auto'>
						<pre>{`// Router-level defaults (router.tsx)
const router = createRouter({
  routeTree,
  defaultErrorComponent: ({ error, reset, info }) => (
    <DefaultError error={error} reset={reset} info={info} />
  ),
  defaultNotFoundComponent: () => <DefaultNotFound />,
})

// Route-level override
export const Route = createFileRoute('/my-route')({
  component: MyComponent,
  errorComponent: ({ error, reset }) => (
    <DefaultCatchBoundary error={error} reset={reset} />
  ),
  notFoundComponent: () => <DefaultNotFound />,
})`}</pre>
					</div>
					<div className='flex flex-wrap gap-2'>
						<Badge variant='outline'>errorComponent</Badge>
						<Badge variant='outline'>notFoundComponent</Badge>
						<Badge variant='outline'>ErrorBoundary</Badge>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className='text-lg'>Error Component Features</CardTitle>
					<CardDescription>What the default error components provide</CardDescription>
				</CardHeader>
				<CardContent>
					<div className='grid gap-4 md:grid-cols-2'>
						<div className='space-y-2'>
							<h4 className='font-medium'>DefaultError</h4>
							<ul className='text-sm text-muted-foreground space-y-1'>
								<li>• Error message display</li>
								<li>• Stack trace (collapsible)</li>
								<li>• Reset/retry button</li>
								<li>• Navigation options</li>
							</ul>
						</div>
						<div className='space-y-2'>
							<h4 className='font-medium'>DefaultCatchBoundary</h4>
							<ul className='text-sm text-muted-foreground space-y-1'>
								<li>• Network error detection</li>
								<li>• Not found detection</li>
								<li>• Router integration</li>
								<li>• Back navigation</li>
							</ul>
						</div>
						<div className='space-y-2'>
							<h4 className='font-medium'>DefaultNotFound</h4>
							<ul className='text-sm text-muted-foreground space-y-1'>
								<li>• Path display</li>
								<li>• Search functionality</li>
								<li>• Home navigation</li>
								<li>• Status link</li>
							</ul>
						</div>
						<div className='space-y-2'>
							<h4 className='font-medium'>fullPage prop</h4>
							<ul className='text-sm text-muted-foreground space-y-1'>
								<li>• true: Full page with header/footer</li>
								<li>• false: Content only (for layouts)</li>
								<li>• Consistent styling both ways</li>
							</ul>
						</div>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className='text-lg'>Other Error States</CardTitle>
					<CardDescription>Application-specific error pages</CardDescription>
				</CardHeader>
				<CardContent className='flex flex-wrap gap-2'>
					<Button variant='outline' size='sm' asChild>
						<Link to='/status/error'>Generic Error</Link>
					</Button>
					<Button variant='outline' size='sm' asChild>
						<Link to='/status/offline'>Offline</Link>
					</Button>
					<Button variant='outline' size='sm' asChild>
						<Link to='/status/session-expired'>Session Expired</Link>
					</Button>
					<Button variant='outline' size='sm' asChild>
						<Link to='/status/payment-required'>Payment Required</Link>
					</Button>
					<Button variant='outline' size='sm' asChild>
						<Link to='/status/bandwidth-exceeded'>Bandwidth Exceeded</Link>
					</Button>
				</CardContent>
			</Card>
		</div>
	)
}

export default ErrorDemoPage
