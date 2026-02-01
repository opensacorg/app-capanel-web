import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/demo/docs')({
	component: RouteComponent,
})

function RouteComponent() {
	return <div>Hello "/home/docs"!</div>
}
