/* eslint-disable */
import type { ConditionalValue } from '../types/index'
import type { DistributiveOmit, Pretty } from '../types/system-types'

interface RadioGroupVariant {
	/**
	 * @default "solid"
	 */
	variant: 'outline' | 'subtle' | 'solid'
	/**
	 * @default "md"
	 */
	size: 'xs' | 'sm' | 'md' | 'lg'
}

type RadioGroupVariantMap = {
	[key in keyof RadioGroupVariant]: Array<RadioGroupVariant[key]>
}

type RadioGroupSlot =
	| 'root'
	| 'label'
	| 'item'
	| 'itemText'
	| 'itemControl'
	| 'indicator'
	| 'itemAddon'
	| 'itemIndicator'

export type RadioGroupVariantProps = {
	[key in keyof RadioGroupVariant]?:
	| ConditionalValue<RadioGroupVariant[key]>
	| undefined
}

export interface RadioGroupRecipe {
	__slot: RadioGroupSlot
	__type: RadioGroupVariantProps
	raw: (props?: RadioGroupVariantProps) => RadioGroupVariantProps
	variantMap: RadioGroupVariantMap
	variantKeys: Array<keyof RadioGroupVariant>
	getVariantProps: (props?: RadioGroupVariantProps) => RadioGroupVariantProps

	(props?: RadioGroupVariantProps): Pretty<Record<RadioGroupSlot, string>>

	splitVariantProps<Props extends RadioGroupVariantProps>(
		props: Props,
	): [
		RadioGroupVariantProps,
		Pretty<DistributiveOmit<Props, keyof RadioGroupVariantProps>>,
	]
}

export declare const radioGroup: RadioGroupRecipe
