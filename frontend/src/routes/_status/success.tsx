import { createFileRoute, Link } from '@tanstack/react-router'
import { CheckCircle2, Home, PartyPopper } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { StatusCard } from '@/routes/_status'

export const Route = createFileRoute('/_status/success')({
	component: SuccessPage,
	head: () => ({
		meta: [{ title: 'Success!' }],
	}),
})

function SuccessPage() {
	return (
		<StatusCard
			variant='success'
			icon={
				<div className='rounded-full bg-green-500/10 p-6'>
					<CheckCircle2 className='size-16 text-green-500' />
				</div>
			}
			title='Success!'
			description='Your action was completed successfully.'
			footer={
				<>
					<Button asChild>
						<Link to='/'>
							<Home className='mr-2 size-4' />
							Go Home
						</Link>
					</Button>
					<Button variant='outline' asChild>
						<Link to='/layout'>Go to Dashboard</Link>
					</Button>
				</>
			}
		>
			<div className='space-y-4 text-center'>
				<div className='flex items-center justify-center gap-2'>
					<PartyPopper className='size-5 text-yellow-500' />
					<Badge variant='default'>Completed</Badge>
					<PartyPopper className='size-5 text-yellow-500' />
				</div>

				<Separator />

				<div className='space-y-2 text-sm text-muted-foreground'>
					<p>What's next?</p>
					<ul className='space-y-1'>
						<li>
							<Link to='/layout' className='text-primary hover:underline'>
								View your dashboard
							</Link>
						</li>
						<li>
							<Link to='/layout/settings' className='text-primary hover:underline'>
								Update your settings
							</Link>
						</li>
						<li>
							<Link to='/docs' className='text-primary hover:underline'>
								Read the documentation
							</Link>
						</li>
					</ul>
				</div>
			</div>
		</StatusCard>
	)
}

export default SuccessPage
