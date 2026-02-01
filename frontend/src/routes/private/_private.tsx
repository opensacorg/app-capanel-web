import { createFileRoute, Link, Outlet } from '@tanstack/react-router'
// import { useAuth } from "../components/hooks/use-auth";

export const Route = createFileRoute('/private/_private')({
	// beforeLoad: ({ context, location }) => {
	// 	// @ts-expect-error
	// 	if (!context.auth.isAuthenticated) {
	// 		throw redirect({
	// 			to: "/login",
	// 			search: {
	// 				redirect: location.href,
	// 			},
	// 		});
	// 	}
	// },
	component: PrivateLayout,
})

function PrivateLayout() {
	// const auth = useAuth();
	return (
		<>
			<div>
				{/* <p>Welcome, {auth.user}!</p> */}
				<Link to='/logout'>Logout</Link>
			</div>
			<hr />
			<Outlet />
		</>
	)
}
