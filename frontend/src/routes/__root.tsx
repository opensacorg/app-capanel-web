import type { QueryClient } from '@tanstack/react-query'

import { TanStackDevtools } from '@tanstack/react-devtools'
import { createRootRouteWithContext, HeadContent, Outlet, Scripts } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'

import { DefaultPending } from '@/components/status/DefaultPending'

import appCss from '../globals.css?url'
import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'
import { Provider } from '../integrations/tanstack-query/root-provider'
import AiDevtools from '../lib/ai-devtools'
import StoreDevtools from '../lib/demo-store-devtools'
import { ReactNode } from "react";

interface MyRouterContext {
	queryClient: QueryClient
}

/**
 * Other redirect strategies are possible; see
 * https://github.com/TanStack/router/tree/main/examples/react/i18n-paraglide#offline-redirect
 */
export const Route = createRootRouteWithContext<MyRouterContext>()({
	head: () => ({
		meta: [
			{
				charSet: 'utf-8',
			},
			{
				name: 'viewport',
				content: 'width=device-width, initial-scale=1',
			},
			{
				title: 'California Accountability Panel',
			},
		],
		links: [
			{
				rel: 'stylesheet',
				href: appCss,
			},
		],
	}),
	pendingComponent: () => (
		<DefaultPending fullPage={false} variant='card' message='Loading application...' />
	),
	component: RootComponent,
	shellComponent: RootDocument,
})

function RootComponent() {
	const { queryClient } = Route.useRouteContext()
	return (
		<Provider queryClient={queryClient}>
			<Outlet />
		</Provider>
	)
}

function RootDocument({ children }: { children: ReactNode }) {
	return (
		<html lang="en">
			<head>
				<HeadContent />
			</head>
			<body>
				{children}
				<TanStackDevtools
					config={{
						position: 'bottom-right',
					}}
					plugins={[
						{
							name: 'Tanstack Router',
							render: <TanStackRouterDevtoolsPanel />,
						},
						TanStackQueryDevtools,
						StoreDevtools,
						AiDevtools,
					]}
				/>
				<Scripts />
			</body>
		</html>
	)
}
