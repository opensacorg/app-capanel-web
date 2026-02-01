import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/demo/_home')({
	component: HomeLayout,
})

function HomeLayout() {
	return (
		<div className='min-h-screen'>
			{/*<ScrollReset />*/}
			{/*<NavbarD52 />*/}
			<Outlet />
		</div>
	)
}
