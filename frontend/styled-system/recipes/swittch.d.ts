/* eslint-disable */
import type { ConditionalValue } from '../types/index'
import type { DistributiveOmit, Pretty } from '../types/system-types'

interface SwittchVariant {
	/**
	 * @default "solid"
	 */
	variant: 'solid' | 'raised'
	/**
	 * @default "md"
	 */
	size: 'xs' | 'sm' | 'md' | 'lg'
}

type SwittchVariantMap = {
	[key in keyof SwittchVariant]: Array<SwittchVariant[key]>
}

type SwittchSlot = 'root' | 'label' | 'control' | 'thumb' | 'indicator'

export type SwittchVariantProps = {
	[key in keyof SwittchVariant]?:
	| ConditionalValue<SwittchVariant[key]>
	| undefined
}

export interface SwittchRecipe {
	__slot: SwittchSlot
	__type: SwittchVariantProps
	raw: (props?: SwittchVariantProps) => SwittchVariantProps
	variantMap: SwittchVariantMap
	variantKeys: Array<keyof SwittchVariant>
	getVariantProps: (props?: SwittchVariantProps) => SwittchVariantProps

	(props?: SwittchVariantProps): Pretty<Record<SwittchSlot, string>>

	splitVariantProps<Props extends SwittchVariantProps>(
		props: Props,
	): [
		SwittchVariantProps,
		Pretty<DistributiveOmit<Props, keyof SwittchVariantProps>>,
	]
}

export declare const swittch: SwittchRecipe
