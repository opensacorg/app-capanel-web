import { Link } from '@tanstack/react-router'
import { FaGear } from 'react-icons/fa6'

import { buttonVariants } from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import useAuth from '@/lib/hooks/useAuth'

export default function SettingsButton({ className }: { className?: string }) {
	const { user: currentUser } = useAuth()

	return (
		<div className={className + ' font-urbanist'}>
			<DropdownMenu>
				<DropdownMenuTrigger className={buttonVariants({ variant: 'outline', size: 'sm' })}>
					<FaGear className='h-5 w-5' />
				</DropdownMenuTrigger>
				<DropdownMenuContent>
					{currentUser ? (
						<DropdownMenuItem
							className='text-base p-3 tracking-wide'
							render={<Link to='/sign-out' />}
						>
							Sign Out
						</DropdownMenuItem>
					) : (
						<>
							<DropdownMenuItem
								className='text-base p-3 tracking-wide'
								render={<Link to='/login' />}
							>
								Sign In
							</DropdownMenuItem>
							<DropdownMenuItem
								className='text-base p-3 tracking-wide'
								render={<Link to='/sign-up' />}
							>
								Sign Up
							</DropdownMenuItem>
						</>
					)}
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	)
}
