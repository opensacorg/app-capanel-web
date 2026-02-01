import { createFileRoute, Link } from '@tanstack/react-router'
import { Check, Home, KeyRound, LogIn } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StatusCard } from '@/routes/_status'

export const Route = createFileRoute('/_status/password-changed')({
	component: PasswordChangedPage,
	head: () => ({
		meta: [{ title: 'Password Changed' }],
	}),
})

function PasswordChangedPage() {
	return (
		<StatusCard
			variant="success"
			icon={
				<div className="rounded-full bg-green-500/10 p-6">
					<KeyRound className="size-16 text-green-500" />
				</div>
			}
			title="Password Changed"
			description="Your password has been updated successfully."
			footer={
				<>
					<Button asChild>
						<Link to="/login">
							<LogIn className="mr-2 size-4" />
							Sign In
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
			<div className="space-y-4">
				<div className="flex items-center justify-center">
					<Badge variant="default">
						<Check className="mr-1 size-3" />
						Secured
					</Badge>
				</div>

				<Alert>
					<KeyRound className="size-4" />
					<AlertTitle>Security Notice</AlertTitle>
					<AlertDescription>
						You've been logged out of all devices for security. Please sign in with your new password.
					</AlertDescription>
				</Alert>
			</div>
		</StatusCard>
	)
}

export default PasswordChangedPage
