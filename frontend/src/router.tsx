import { createRouter } from '@tanstack/react-router'

import { DefaultError } from '@/components/status/DefaultError'
import { DefaultNotFound } from '@/components/status/DefaultNotFound'

import * as TanstackQuery from './integrations/tanstack-query/root-provider'
import { routeTree } from './routeTree.gen'

export const getRouter = () => {
	const queryContext = TanstackQuery.getContext()
	return createRouter({
		routeTree,
		context: {
			...queryContext,
		},
		defaultPreload: 'intent',
		defaultNotFoundComponent: () => <DefaultNotFound fullPage />,
		defaultErrorComponent: ({ error, reset, info }) => (
			<DefaultError error={error} reset={reset} info={info} fullPage />
		),
	})
}
