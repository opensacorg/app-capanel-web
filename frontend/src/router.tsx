import { createRouter } from '@tanstack/react-router'

import { DefaultError } from '@/components/status/DefaultError'
import { DefaultNotFound } from '@/components/status/DefaultNotFound'

import * as TanstackQuery from './integrations/tanstack-query/root-provider'
import { routeTree } from './routeTree.gen'

export const getRouter = () => {
	const queryContext = TanstackQuery.getContext()
	return createRouter({
		routeTree,
		scrollRestoration: true,
		context: {
			...queryContext,
		},
		defaultPreload: 'intent',
		defaultNotFoundComponent: () => <DefaultNotFound fullPage />,
		defaultErrorComponent: ({ error, reset, info }) => (
			<DefaultError error={error} reset={reset} info={info} fullPage />
		),
		parseSearch: (searchStr) => {
			const search: Record<string, any> = {}
			const params = new URLSearchParams(searchStr)
			params.forEach((value, key) => {
				try {
					// Detect if value is a JSON string (starts with { [ " or is a number/boolean)
					// but we'll try JSON.parse on everything and fallback to raw string
					search[key] = JSON.parse(value)
				} catch {
					search[key] = value
				}
			})
			return search
		},
		stringifySearch: (search) => {
			const params = new URLSearchParams()
			Object.entries(search).forEach(([key, value]) => {
				if (value === undefined || value === null) return
				if (typeof value === 'string') {
					params.set(key, value)
				} else {
					params.set(key, JSON.stringify(value))
				}
			})
			const searchStr = params.toString()
			return searchStr ? `?${searchStr}` : ''
		},
	})
}
