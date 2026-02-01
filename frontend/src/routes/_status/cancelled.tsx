import { createFileRoute, Link } from '@tanstack/react-router'
import { Ban, Home, RefreshCcw } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { StatusCard } from '@/routes/_status'

export const Route = createFileRoute('/_status/cancelled')({
	component: CancelledPage,
	head: () => ({
		meta: [{ title: 'Action Cancelled' }],
	}),
})

function CancelledPage() {
	return (
		<StatusCard
			variant="default"
			icon={
				<div className="rounded-full bg-muted p-6">
					<Ban className="size-16 text-muted-foreground" />
				</div>
			}
			title="Action Cancelled"
			description="The operation was cancelled. No changes were made."
			footer={
				<>
					<Button onClick={() => window.history.back()}>
						<RefreshCcw className="mr-2 size-4" />
						Try Again
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
				<Ban className="size-4" />
				<AlertTitle>No Changes Made</AlertTitle>
				<AlertDescription>
					Your data remains unchanged. You can safely navigate away or try again.
				</AlertDescription>
			</Alert>
		</StatusCard>
	)
}

export default CancelledPage
