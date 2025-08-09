import { Link } from "@tanstack/react-router";
import DistrictSelector from "../Navbar3/DistrictSelector.tsx";
import "./NavbarB56.css";

export default function NavbarB56() {
	return (
		<div className="h-[4.25rem] bg-white text-element-text-primary w-full shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] sticky top-0 z-50">
			<nav className="h-full flex items-center container mx-auto px-6 gap-2">
				<div className="flex items-center h-full py-2">
					<Link
						className="pr-4 h-full rounded font-bold gap-[13px] text-element-primary font-source-serif-4 text-3xl flex items-center leading-none tracking-tighter"
						to="/"
					>
						<img src="/logo.svg" alt="Logo" className="h-10" />
						<span className="">Dashboard 5</span>
					</Link>
					<DistrictSelector />
				</div>
				<div className="grow h-full flex items-center justify-end ">
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
				</div>
			</nav>
		</div>
	);
}
