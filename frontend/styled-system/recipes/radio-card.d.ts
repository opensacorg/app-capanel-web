/* eslint-disable */
import type { ConditionalValue } from '../types/index'
import type { DistributiveOmit, Pretty } from '../types/system-types'

interface RadioCardVariant {
	/**
	 * @default "md"
	 */
	size: 'sm' | 'md' | 'lg'
	/**
	 * @default "outline"
	 */
	variant: 'surface' | 'subtle' | 'outline' | 'solid'
	justify: 'start' | 'end' | 'center'
	/**
	 * @default "start"
	 */
	align: 'start' | 'end' | 'center'
	/**
	 * @default "horizontal"
	 */
	orientation: 'vertical' | 'horizontal'
}

type RadioCardVariantMap = {
	[key in keyof RadioCardVariant]: Array<RadioCardVariant[key]>
}

type RadioCardSlot =
	| 'root'
	| 'label'
	| 'item'
	| 'itemText'
	| 'itemControl'
	| 'indicator'
	| 'itemAddon'
	| 'itemIndicator'
	| 'itemContent'
	| 'itemDescription'

export type RadioCardVariantProps = {
	[key in keyof RadioCardVariant]?:
	| ConditionalValue<RadioCardVariant[key]>
	| undefined
}

export interface RadioCardRecipe {
	__slot: RadioCardSlot
	__type: RadioCardVariantProps
	raw: (props?: RadioCardVariantProps) => RadioCardVariantProps
	variantMap: RadioCardVariantMap
	variantKeys: Array<keyof RadioCardVariant>
	getVariantProps: (props?: RadioCardVariantProps) => RadioCardVariantProps

	(props?: RadioCardVariantProps): Pretty<Record<RadioCardSlot, string>>

	splitVariantProps<Props extends RadioCardVariantProps>(
		props: Props,
	): [
		RadioCardVariantProps,
		Pretty<DistributiveOmit<Props, keyof RadioCardVariantProps>>,
	]
}

export declare const radioCard: RadioCardRecipe
