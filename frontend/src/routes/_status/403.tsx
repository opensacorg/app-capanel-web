import { createFileRoute, Link } from '@tanstack/react-router'
import { Home, ShieldOff } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { StatusCard } from '@/routes/_status'

export const Route = createFileRoute('/_status/403')({
	component: ForbiddenPage,
	head: () => ({
		meta: [{ title: '403 - Forbidden' }],
	}),
})

function ForbiddenPage() {
	return (
		<StatusCard
			variant="error"
			icon={
				<div className="rounded-full bg-destructive/10 p-6">
					<ShieldOff className="size-16 text-destructive" />
				</div>
			}
			title="403 - Forbidden"
			description="You don't have permission to access this resource."
			footer={
				<>
					<Button asChild>
						<Link to="/">
							<Home className="mr-2 size-4" />
							Go Home
						</Link>
					</Button>
					<Button variant="outline" asChild>
						<Link to="/support">
							Contact Support
						</Link>
					</Button>
				</>
			}
		>
			<Alert>
				<ShieldOff className="size-4" />
				<AlertTitle>Access Denied</AlertTitle>
				<AlertDescription>
					If you believe this is an error, please contact your administrator or support team.
				</AlertDescription>
			</Alert>
		</StatusCard>
	)
}

export default ForbiddenPage
