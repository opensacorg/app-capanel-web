/* eslint-disable */
import type { ConditionalValue } from '../types/index'
import type { DistributiveOmit, Pretty } from '../types/system-types'

type CollapsibleVariant = {}

type CollapsibleVariantMap = {
	[key in keyof CollapsibleVariant]: Array<CollapsibleVariant[key]>
}

type CollapsibleSlot = 'root' | 'trigger' | 'content' | 'indicator'

export type CollapsibleVariantProps = {
	[key in keyof CollapsibleVariant]?:
	| ConditionalValue<CollapsibleVariant[key]>
	| undefined
}

export interface CollapsibleRecipe {
	__slot: CollapsibleSlot
	__type: CollapsibleVariantProps
	raw: (props?: CollapsibleVariantProps) => CollapsibleVariantProps
	variantMap: CollapsibleVariantMap
	variantKeys: Array<keyof CollapsibleVariant>
	getVariantProps: (props?: CollapsibleVariantProps) => CollapsibleVariantProps

	(props?: CollapsibleVariantProps): Pretty<Record<CollapsibleSlot, string>>

	splitVariantProps<Props extends CollapsibleVariantProps>(
		props: Props,
	): [
		CollapsibleVariantProps,
		Pretty<DistributiveOmit<Props, keyof CollapsibleVariantProps>>,
	]
}

export declare const collapsible: CollapsibleRecipe
