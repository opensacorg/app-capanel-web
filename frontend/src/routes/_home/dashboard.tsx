import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_home/dashboard")({
	component: RouteComponent,
});

function RouteComponent() {
	return <div>Shawn edit here</div>;
}
