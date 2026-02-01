import { createFileRoute, Link } from '@tanstack/react-router'
import { Check, Home, Shield, Smartphone } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StatusCard } from '@/routes/_status'

export const Route = createFileRoute('/_status/2fa-enabled')({
	component: TwoFactorEnabledPage,
	head: () => ({
		meta: [{ title: '2FA Enabled' }],
	}),
})

function TwoFactorEnabledPage() {
	return (
		<StatusCard
			variant="success"
			icon={
				<div className="rounded-full bg-green-500/10 p-6">
					<Shield className="size-16 text-green-500" />
				</div>
			}
			title="2FA Enabled"
			description="Two-factor authentication is now active on your account."
			footer={
				<>
					<Button asChild>
						<Link to="/layout/settings">
							View Settings
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
				<div className="flex items-center justify-center gap-2">
					<Badge variant="default">
						<Check className="mr-1 size-3" />
						Secured
					</Badge>
				</div>

				<Alert>
					<Smartphone className="size-4" />
					<AlertTitle>Recovery Codes</AlertTitle>
					<AlertDescription>
						Make sure to save your recovery codes in a safe place. You'll need them if you lose access to your authenticator.
					</AlertDescription>
				</Alert>

				<div className="rounded-lg border bg-muted/50 p-3 font-mono text-xs text-center space-y-1">
					<div>XXXX-XXXX-XXXX</div>
					<div>XXXX-XXXX-XXXX</div>
					<div>XXXX-XXXX-XXXX</div>
				</div>
			</div>
		</StatusCard>
	)
}

export default TwoFactorEnabledPage
