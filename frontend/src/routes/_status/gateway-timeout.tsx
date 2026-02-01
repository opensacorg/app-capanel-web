import { createFileRoute, Link } from '@tanstack/react-router'
import { Clock, Home, RefreshCcw, ServerCrash } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { StatusCard } from '@/routes/_status'

export const Route = createFileRoute('/_status/gateway-timeout')({
	component: GatewayTimeoutPage,
	head: () => ({
		meta: [{ title: '504 - Gateway Timeout' }],
	}),
})

function GatewayTimeoutPage() {
	return (
		<StatusCard
			variant='error'
			icon={
				<div className='rounded-full bg-destructive/10 p-6'>
					<ServerCrash className='size-16 text-destructive' />
				</div>
			}
			title='504 - Gateway Timeout'
			description='The upstream server failed to respond in time.'
			footer={
				<>
					<Button onClick={() => window.location.reload()}>
						<RefreshCcw className='mr-2 size-4' />
						Try Again
					</Button>
					<Button variant='outline' asChild>
						<Link to='/'>
							<Home className='mr-2 size-4' />
							Go Home
						</Link>
					</Button>
				</>
			}
		>
			<Alert>
				<Clock className='size-4' />
				<AlertTitle>Server Timeout</AlertTitle>
				<AlertDescription>
					The server is taking longer than expected to respond. This could be due to high traffic or
					a temporary issue.
				</AlertDescription>
			</Alert>
		</StatusCard>
	)
}

export default GatewayTimeoutPage
