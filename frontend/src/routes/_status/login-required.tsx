import { createFileRoute, Link } from '@tanstack/react-router'
import { Home, LogIn, UserCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { StatusCard } from '@/routes/_status'

export const Route = createFileRoute('/_status/login-required')({
	component: LoginRequiredPage,
	head: () => ({
		meta: [{ title: 'Login Required' }],
	}),
})

function LoginRequiredPage() {
	return (
		<StatusCard
			variant='info'
			icon={
				<div className='rounded-full bg-blue-500/10 p-6'>
					<UserCircle className='size-16 text-blue-500' />
				</div>
			}
			title='Login Required'
			description='Please sign in to access this content.'
			footer={
				<>
					<Button asChild>
						<Link to='/login'>
							<LogIn className='mr-2 size-4' />
							Sign In
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
			<div className='space-y-4 text-center'>
				<p className='text-sm text-muted-foreground'>
					This page requires authentication. Please sign in with your account to continue.
				</p>
				<Separator />
				<p className='text-sm text-muted-foreground'>
					New user?{' '}
					<Link to='/signup' className='text-primary hover:underline'>
						Create an account
					</Link>
				</p>
			</div>
		</StatusCard>
	)
}

export default LoginRequiredPage
