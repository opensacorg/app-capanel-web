import { createFileRoute, Link } from "@tanstack/react-router";
import SearchHomepageForm from "../../components/form/home-search-form";
import GaugeChart from "../../integrations/apache-echarts/gauge-chart";

export const Route = createFileRoute("/_home/")({
	component: HomePage,
});

function HomePage() {
	return (
		<main className="flex flex-col serif text-element-text-regular">
			<div className=" flex container mx-auto px-6 flex-col xl:flex-row">
				<div className="flex-1">
					<header>
						<div className="pt-16 pb-12">
							<h1 className="font-bold text-3xl pb-2">
								Welcome to California Accountability Panel
							</h1>
							<p>
								Compare school performance standards based on the{" "}
								<a
									className="underline"
									href="https://www.caschooldashboard.org/"
								>
									California Data Dashboard
								</a>
								.
							</p>
							<div className="flex pt-2 gap-4 ps-2 items-center">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									strokeWidth={1.5}
									stroke="currentColor"
									className="size-6"
								>
									<title>Information list icon</title>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18"
									/>
								</svg>
								<ul className="list-disc list-inside">
									<li>
										All your data stays private in your browser - Learning
										Blocks never saves it online.
									</li>
									<li>
										California Accountability Panel saves progress locally. What you
										sync stays on your device.
									</li>
								</ul>
							</div>
						</div>
						<div className="">
							<h2 className="font-bold text-xl pb-4">
								Search for a school to find information.
							</h2>
							<SearchHomepageForm />
						</div>
					</header>
				</div>
				<div className="flex-1">
					<section className="pt-16 text-center flex flex-col items-center">
						<h2 className="text-2xl font-bold max-w-xl ">
							Performance standards are represented by one of five colors.
						</h2>
						<GaugeChart />
						<Link to="/docs" className="p-4">
							Learn more
						</Link>
					</section>
				</div>
			</div>
			<section className="bg-[#282c34] text-white">
				<div className=" flex container mx-auto px-6">
					<h2 className="text-[calc(10px+2vmin)]">
						Indicators from Red, orange, yellow, green, to Blue.
					</h2>
					<a
						className="text-[#61dafb] hover:underline"
						href="https://reactjs.org"
						target="_blank"
						rel="noopener noreferrer"
					>
						Learn React
					</a>
					<a
						className="text-[#61dafb] hover:underline"
						href="https://tanstack.com"
						target="_blank"
						rel="noopener noreferrer"
					>
						Learn TanStack
					</a>
				</div>
			</section>
		</main>
	);
}
