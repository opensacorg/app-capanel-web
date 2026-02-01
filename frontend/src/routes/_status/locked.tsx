import { createFileRoute, Link } from '@tanstack/react-router'
import { Home, Lock, Mail } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { StatusCard } from '@/routes/_status'

export const Route = createFileRoute('/_status/locked')({
	component: LockedPage,
	head: () => ({
		meta: [{ title: '423 - Account Locked' }],
	}),
})

function LockedPage() {
	return (
		<StatusCard
			variant='error'
			icon={
				<div className='rounded-full bg-destructive/10 p-6'>
					<Lock className='size-16 text-destructive' />
				</div>
			}
			title='423 - Account Locked'
			description='Your account has been temporarily locked.'
			footer={
				<>
					<Button asChild>
						<Link to='/support'>
							<Mail className='mr-2 size-4' />
							Contact Support
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
			<Alert variant='destructive'>
				<Lock className='size-4' />
				<AlertTitle>Account Security</AlertTitle>
				<AlertDescription>
					This may be due to multiple failed login attempts or suspicious activity. Please contact
					support to unlock your account.
				</AlertDescription>
			</Alert>
		</StatusCard>
	)
}

export default LockedPage
