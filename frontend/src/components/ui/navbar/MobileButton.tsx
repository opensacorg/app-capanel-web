import { useNavigate } from '@tanstack/react-router'
import { FaBars } from 'react-icons/fa'

import { Button } from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import useAuth from '@/lib/hooks/useAuth'

export default function MobileButton({ className }: { className?: string }) {
	const { user: currentUser } = useAuth()
	const navigate = useNavigate()

	return (
		<div className={className}>
			<DropdownMenu>
				<DropdownMenuTrigger render={<Button variant='outline' size='sm' />}>
					<FaBars className='h-5 w-5' />
				</DropdownMenuTrigger>
				<DropdownMenuContent>
					<DropdownMenuItem
						onSelect={() => navigate({ to: '/' })}
						className='text-base p-3 tracking-wide'
					>
						Home
					</DropdownMenuItem>
					<DropdownMenuItem
						onSelect={() => navigate({ to: '/dashboard' })}
						className='text-base p-3 tracking-wide'
					>
						Dashboard
					</DropdownMenuItem>
					{currentUser ? (
						<DropdownMenuItem
							onSelect={() => navigate({ to: '/sign-out' })}
							className='text-base p-3 tracking-wide'
						>
							Sign Out
						</DropdownMenuItem>
					) : (
						<>
							<DropdownMenuItem
								onSelect={() => navigate({ to: '/login' })}
								className='text-base p-3 tracking-wide'
							>
								Sign In
							</DropdownMenuItem>
							<DropdownMenuItem
								onSelect={() => navigate({ to: '/sign-up' })}
								className='text-base p-3 tracking-wide'
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
