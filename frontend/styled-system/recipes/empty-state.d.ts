/* eslint-disable */
import type { ConditionalValue } from '../types/index'
import type { DistributiveOmit, Pretty } from '../types/system-types'

interface EmptyStateVariant {
	/**
	 * @default "md"
	 */
	size: 'sm' | 'md' | 'lg'
}

type EmptyStateVariantMap = {
	[key in keyof EmptyStateVariant]: Array<EmptyStateVariant[key]>
}

type EmptyStateSlot = 'root' | 'content' | 'indicator' | 'title' | 'description'

export type EmptyStateVariantProps = {
	[key in keyof EmptyStateVariant]?:
	| ConditionalValue<EmptyStateVariant[key]>
	| undefined
}

export interface EmptyStateRecipe {
	__slot: EmptyStateSlot
	__type: EmptyStateVariantProps
	raw: (props?: EmptyStateVariantProps) => EmptyStateVariantProps
	variantMap: EmptyStateVariantMap
	variantKeys: Array<keyof EmptyStateVariant>
	getVariantProps: (props?: EmptyStateVariantProps) => EmptyStateVariantProps

	(props?: EmptyStateVariantProps): Pretty<Record<EmptyStateSlot, string>>

	splitVariantProps<Props extends EmptyStateVariantProps>(
		props: Props,
	): [
		EmptyStateVariantProps,
		Pretty<DistributiveOmit<Props, keyof EmptyStateVariantProps>>,
	]
}

export declare const emptyState: EmptyStateRecipe
