import { createFileRoute, Outlet } from "@tanstack/react-router";
import NavbarD52 from "../components/ui/navbar/Navbar1/NavbarD52.tsx";

export const Route = createFileRoute("/_home")({
	component: HomeLayout,
});

function HomeLayout() {
	return (
		<div className="min-h-screen">
			<NavbarD52 />
			<Outlet />
		</div>
	);
}
