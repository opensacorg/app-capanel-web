import { createFileRoute, Link } from '@tanstack/react-router'
import { Clock, Home, LogIn, TimerOff } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { StatusCard } from '@/routes/_status'

export const Route = createFileRoute('/_status/session-expired')({
	component: SessionExpiredPage,
	head: () => ({
		meta: [{ title: 'Session Expired' }],
	}),
})

function SessionExpiredPage() {
	return (
		<StatusCard
			variant="warning"
			icon={
				<div className="rounded-full bg-yellow-500/10 p-6">
					<TimerOff className="size-16 text-yellow-500" />
				</div>
			}
			title="Session Expired"
			description="Your session has expired due to inactivity."
			footer={
				<>
					<Button asChild>
						<Link to="/login">
							<LogIn className="mr-2 size-4" />
							Sign In Again
						</Link>
					</Button>
					<Button variant="outline" asChild>
						<Link to="/">
							<Home className="mr-2 size-4" />
							Go Home
						</Link>
					</Button>
				</>
			}
		>
			<Alert>
				<Clock className="size-4" />
				<AlertTitle>Security Notice</AlertTitle>
				<AlertDescription>
					For your security, sessions automatically expire after 30 minutes of inactivity.
				</AlertDescription>
			</Alert>
		</StatusCard>
	)
}

export default SessionExpiredPage
