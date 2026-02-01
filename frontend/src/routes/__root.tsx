import type { QueryClient } from '@tanstack/react-query'

import { TanStackDevtools } from '@tanstack/react-devtools'
import { createRootRouteWithContext, HeadContent, Scripts } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'

import {
	DefaultCatchBoundary,
	DefaultError,
	DefaultNotFound,
	DefaultPending,
} from '@/components/status'
import { getLocale } from '@/integrations/paraglide/runtime'

import Header from '../components/Header'
import appCss from '../globals.css?url'
import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'
import AiDevtools from '../lib/ai-devtools'
import StoreDevtools from '../lib/demo-store-devtools'

interface MyRouterContext {
	queryClient: QueryClient
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	beforeLoad: async () => {
		// Other redirect strategies are possible; see
		// https://github.com/TanStack/router/tree/main/examples/react/i18n-paraglide#offline-redirect
		if (typeof document !== 'undefined') {
			document.documentElement.setAttribute('lang', getLocale())
		}
	},

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
				title: 'TanStack Start Starter',
			},
		],
		links: [
			{
				rel: 'stylesheet',
				href: appCss,
			},
		],
	}),

	// Root-level status components (these are the fallbacks for the entire app)
	notFoundComponent: () => <DefaultNotFound fullPage />,
	errorComponent: ({ error, reset, info }) => (
		<DefaultError error={error} reset={reset} info={info} fullPage />
	),
	pendingComponent: () => (
		<DefaultPending fullPage={false} variant='card' message='Loading application...' />
	),

	shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang={getLocale()}>
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

// 	notFoundComponent: () => <NotFound />,
// 	errorComponent: () => <ErrorComponent />,
// });
