import { createFileRoute, Link } from '@tanstack/react-router'
import { CreditCard, Home, Sparkles, XCircle } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { StatusCard } from '@/routes/_status'

export const Route = createFileRoute('/_status/subscription-cancelled')({
	component: SubscriptionCancelledPage,
	head: () => ({
		meta: [{ title: 'Subscription Cancelled' }],
	}),
})

function SubscriptionCancelledPage() {
	return (
		<StatusCard
			variant='default'
			icon={
				<div className='rounded-full bg-muted p-6'>
					<XCircle className='size-16 text-muted-foreground' />
				</div>
			}
			title='Subscription Cancelled'
			description='Your subscription has been cancelled.'
			footer={
				<>
					<Button asChild>
						<Link to='/pricing'>
							<Sparkles className='mr-2 size-4' />
							Resubscribe
						</Link>
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
			<div className='space-y-4'>
				<Alert>
					<CreditCard className='size-4' />
					<AlertTitle>Access Until End of Billing Period</AlertTitle>
					<AlertDescription>
						You'll continue to have access to Pro features until Feb 28, 2026.
					</AlertDescription>
				</Alert>

				<Separator />

				<p className='text-center text-sm text-muted-foreground'>
					We're sorry to see you go. If you change your mind, you can resubscribe anytime.
				</p>
			</div>
		</StatusCard>
	)
}

export default SubscriptionCancelledPage
