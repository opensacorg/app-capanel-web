import { createFileRoute, Link } from '@tanstack/react-router'
import { Download, FileDown, Home } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { StatusCard } from '@/routes/_status'

export const Route = createFileRoute('/_status/export-ready')({
	component: ExportReadyPage,
	head: () => ({
		meta: [{ title: 'Export Ready' }],
	}),
})

function ExportReadyPage() {
	return (
		<StatusCard
			variant="success"
			icon={
				<div className="rounded-full bg-green-500/10 p-6">
					<FileDown className="size-16 text-green-500" />
				</div>
			}
			title="Export Ready"
			description="Your data export has been generated successfully."
			footer={
				<>
					<Button>
						<Download className="mr-2 size-4" />
						Download
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
					<Badge variant="default">Ready</Badge>
				</div>

				<div className="rounded-lg border bg-muted/50 p-4">
					<div className="flex items-center justify-between text-sm">
						<span className="text-muted-foreground">File</span>
						<span className="font-medium">export_2026-02-01.zip</span>
					</div>
					<Separator className="my-2" />
					<div className="flex items-center justify-between text-sm">
						<span className="text-muted-foreground">Size</span>
						<span className="font-medium">24.5 MB</span>
					</div>
					<Separator className="my-2" />
					<div className="flex items-center justify-between text-sm">
						<span className="text-muted-foreground">Records</span>
						<span className="font-medium">1,234</span>
					</div>
				</div>

				<p className="text-center text-sm text-muted-foreground">
					This download link expires in 24 hours.
				</p>
			</div>
		</StatusCard>
	)
}

export default ExportReadyPage
