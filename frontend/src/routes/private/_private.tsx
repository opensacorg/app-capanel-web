import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import useAuth from "@/lib/hooks/useAuth.ts";
import { Button } from "@/components/ui/button.tsx";

export const Route = createFileRoute('/private/_private')({
	beforeLoad: ({ context, location }) => {
		// @ts-expect-error
		if (!context.auth.isAuthenticated) {
			throw redirect({
				to: "/login",
				search: {
					redirect: location.href,
				},
			});
		}
	},
	component: PrivateLayout,
})

function PrivateLayout() {
	const auth = useAuth();
	return (
		<>
			<div>
				 <p>Welcome, {auth.user}!</p>
				<Button onClick={() => auth.logout()}>Logout</Button>
			</div>
			<hr />
			<Outlet />
		</>
	)
}
