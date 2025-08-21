import { Link } from "@tanstack/react-router";
import "./NavbarD52.css";
import useAuth from "../../../hooks/useAuth.ts";
import SearchBar from "./SearchBar.tsx";
import SettingsButton from "./SettingsButton";
import UserAvatar from "./UserAvatar.tsx";

export default function NavbarD52() {
	const { user: currentUser } = useAuth();

	return (
		<div className="bg-white h-[4.25rem] text-element-text-primary w-full border-b-[#dcdfe6] border-b-1 sticky top-0 z-50">
			<nav className="h-full flex items-center max-w-[96rem] mx-auto px-6 gap-2">
				<div className="flex items-center h-full py-2 text-nowrap">
					<Link
						className="pr-4 h-full rounded  gap-[13px]  text-[#0A2D3C] text-3xl flex items-center leading-none font-urbanist"
						to="/"
					>
						<img src="/assets/logo/logo.svg" alt="Logo" className="h-14" />
						<span className="">
							<span className="font-bold">California Accountability</span> Panel
						</span>
					</Link>
					{/* <DistrictSelector /> */}
				</div>
				<div className="grow h-full flex items-center justify-end">
					<SearchBar className="me-8" />
					<Link
						to="/"
						className="navbar2-link"
						activeProps={{
							className: "navbar2-link--selected",
						}}
					>
						Home
					</Link>
					<Link
						to="/dashboard"
						className="navbar2-link"
						activeProps={{
							className: "navbar2-link--selected",
						}}
					>
						Dashboard
					</Link>
					<div className="px-3">
						<SettingsButton />
					</div>
					{currentUser && (
						<Link to="/user">
							<UserAvatar />
						</Link>
					)}
				</div>
			</nav>
		</div>
	);
}
