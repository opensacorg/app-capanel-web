import { createRouter } from '@tanstack/react-router'
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'

import { DefaultError, DefaultNotFound, DefaultPending } from '@/components/status'
import { deLocalizeUrl, localizeUrl } from '@/integrations/paraglide/runtime'

import * as TanstackQuery from './integrations/tanstack-query/root-provider'
import { routeTree } from './routeTree.gen'

/**
 * Paraglide URL rewrite docs: https://github.com/TanStack/router/tree/main/examples/react/i18n-paraglide#rewrite-url
 */
export const getRouter = () => {
	const queryContext = TanstackQuery.getContext()
	const router = createRouter({
		routeTree,
		context: {
			...queryContext,
		},
		rewrite: {
			input: ({ url }) => deLocalizeUrl(url),
			output: ({ url }) => localizeUrl(url),
		},
		defaultPreload: 'intent',
		// Default status components for the entire app
		defaultNotFoundComponent: () => <DefaultNotFound fullPage />,
		defaultErrorComponent: ({ error, reset, info }) => (
			<DefaultError error={error} reset={reset} info={info} fullPage />
		),
		defaultPendingComponent: () => <DefaultPending fullPage={false} variant='spinner' />,
		// Use catch boundary for route-level errors with navigation support
		// This provides retry and back navigation functionality
		// Individual routes can override with their own errorComponent
	})
	setupRouterSsrQueryIntegration({
		router,
		queryClient: queryContext.queryClient,
	})
	return router
}
