import { useNavigate } from '@tanstack/react-router'
import { FaGear } from 'react-icons/fa6'

import { Button } from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import useAuth from '@/lib/hooks/useAuth'

export default function SettingsButton({ className }: { className?: string }) {
	const { user: currentUser } = useAuth()
	const navigate = useNavigate()

	return (
		<div className={className}>
			<DropdownMenu>
				<DropdownMenuTrigger render={<Button variant='outline' size='sm' />}>
					<FaGear className='h-5 w-5' />
				</DropdownMenuTrigger>
				<DropdownMenuContent>
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
