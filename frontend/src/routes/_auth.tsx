import { Flex } from "@chakra-ui/react";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { CustomProvider } from "../components/ui/provider";

import Navbar from "../components/Common/Navbar";
import Sidebar from "../components/Common/Sidebar";
import { isLoggedIn } from "../hooks/useAuth";

export const Route = createFileRoute("/_auth")({
	component: Layout,
	beforeLoad: async () => {
		if (!isLoggedIn()) {
			throw redirect({
				to: "/login",
			})
		}
	},
});

function Layout() {
	return (
				<CustomProvider>
		
		<Flex direction="column" h="100vh">
			<Navbar />
			<Flex flex="1" overflow="hidden">
				<Sidebar />
				<Flex flex="1" direction="column" p={4} overflowY="auto">
					<Outlet />
				</Flex>
			</Flex>
		</Flex>
		</CustomProvider>
	)
}

export default Layout;
