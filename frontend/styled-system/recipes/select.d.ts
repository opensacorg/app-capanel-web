/* eslint-disable */
import type { ConditionalValue } from '../types/index'
import type { DistributiveOmit, Pretty } from '../types/system-types'

interface SelectVariant {
	/**
	 * @default "outline"
	 */
	variant: 'outline' | 'subtle'
	/**
	 * @default "md"
	 */
	size: 'xs' | 'sm' | 'md' | 'lg'
}

type SelectVariantMap = {
	[key in keyof SelectVariant]: Array<SelectVariant[key]>
}

type SelectSlot =
	| 'label'
	| 'positioner'
	| 'trigger'
	| 'indicator'
	| 'clearTrigger'
	| 'item'
	| 'itemText'
	| 'itemIndicator'
	| 'itemGroup'
	| 'itemGroupLabel'
	| 'list'
	| 'content'
	| 'root'
	| 'control'
	| 'valueText'
	| 'indicatorGroup'

export type SelectVariantProps = {
	[key in keyof SelectVariant]?:
	| ConditionalValue<SelectVariant[key]>
	| undefined
}

export interface SelectRecipe {
	__slot: SelectSlot
	__type: SelectVariantProps
	raw: (props?: SelectVariantProps) => SelectVariantProps
	variantMap: SelectVariantMap
	variantKeys: Array<keyof SelectVariant>
	getVariantProps: (props?: SelectVariantProps) => SelectVariantProps

	(props?: SelectVariantProps): Pretty<Record<SelectSlot, string>>

	splitVariantProps<Props extends SelectVariantProps>(
		props: Props,
	): [
		SelectVariantProps,
		Pretty<DistributiveOmit<Props, keyof SelectVariantProps>>,
	]
}

export declare const select: SelectRecipe
