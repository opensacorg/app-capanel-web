import { createFileRoute, Outlet } from "@tanstack/react-router";
import NavbarB56 from "../components/ui/navbar/Navbar2/NavbarB56.tsx";

export const Route = createFileRoute("/_home")({
	component: HomeLayout,
});

function HomeLayout() {
	return (
		<div className="min-h-screen">
			<NavbarB56 />
			<Outlet />
		</div>
	);
}
