/* eslint-disable */
import type { ConditionalValue } from '../types/index'
import type { DistributiveOmit, Pretty } from '../types/system-types'

type TooltipVariant = {}

type TooltipVariantMap = {
	[key in keyof TooltipVariant]: Array<TooltipVariant[key]>
}

type TooltipSlot = 'trigger' | 'arrow' | 'arrowTip' | 'positioner' | 'content'

export type TooltipVariantProps = {
	[key in keyof TooltipVariant]?:
	| ConditionalValue<TooltipVariant[key]>
	| undefined
}

export interface TooltipRecipe {
	__slot: TooltipSlot
	__type: TooltipVariantProps
	raw: (props?: TooltipVariantProps) => TooltipVariantProps
	variantMap: TooltipVariantMap
	variantKeys: Array<keyof TooltipVariant>
	getVariantProps: (props?: TooltipVariantProps) => TooltipVariantProps

	(props?: TooltipVariantProps): Pretty<Record<TooltipSlot, string>>

	splitVariantProps<Props extends TooltipVariantProps>(
		props: Props,
	): [
		TooltipVariantProps,
		Pretty<DistributiveOmit<Props, keyof TooltipVariantProps>>,
	]
}

export declare const tooltip: TooltipRecipe
