import { Link } from "@tanstack/react-router";
import "./NavbarB56.css";
import UserAvatar from "./UserAvatar.tsx";

export default function NavbarB56() {
	return (
		<div className="h-[4.25rem] bg-[#f2ecee] text-element-text-primary w-full border-b-[#dcdfe6] border-1 sticky top-0 z-50">
			<nav className="h-full flex items-center max-w-[96rem] mx-auto px-6 gap-2">
				<div className="flex items-center h-full py-2">
					<Link
						className="pr-4 h-full rounded font-bold gap-[13px]   text-[#303133] text-2xl flex items-center leading-none tracking-tight font-roboto"
						to="/"
					>
						<img src="/logo.png" alt="Logo" className="h-14" />
						<span className="mt-2">California Accountability Panel</span>
					</Link>
					{/* <DistrictSelector /> */}
				</div>
				<div className="grow h-full flex items-center justify-end">
					<Link
						to="/"
						className="navbar2-link"
						activeProps={{
							className: "navbar2-link navbar2-link--selected",
						}}
					>
						Home
					</Link>
					<Link
						to="/dashboard"
						className="navbar2-link"
						activeProps={{
							className: "navbar2-link navbar2-link--selected",
						}}
					>
						Dashboard
					</Link>
					<Link
						to="/api-sync"
						className="navbar2-link"
						activeProps={{
							className: "navbar2-link navbar2-link--selected",
						}}
					>
						API Sync
					</Link>
					<Link
						to="/docs"
						className="navbar2-link"
						activeProps={{
							className: "navbar2-link navbar2-link--selected",
						}}
					>
						Documentation
					</Link>
					<Link to="/user">
						<UserAvatar />
					</Link>
				</div>
			</nav>
		</div>
	);
}
