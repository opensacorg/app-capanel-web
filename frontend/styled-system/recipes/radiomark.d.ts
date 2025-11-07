/* eslint-disable */
import type { ConditionalValue } from '../types/index'
import type { DistributiveOmit, Pretty } from '../types/system-types'

interface RadiomarkVariant {
	/**
	 * @default "solid"
	 */
	variant: 'solid' | 'subtle' | 'outline' | 'inverted'
	/**
	 * @default "md"
	 */
	size: 'xs' | 'sm' | 'md' | 'lg'
}

type RadiomarkVariantMap = {
	[key in keyof RadiomarkVariant]: Array<RadiomarkVariant[key]>
}

export type RadiomarkVariantProps = {
	[key in keyof RadiomarkVariant]?:
	| ConditionalValue<RadiomarkVariant[key]>
	| undefined
}

export interface RadiomarkRecipe {
	__type: RadiomarkVariantProps
	raw: (props?: RadiomarkVariantProps) => RadiomarkVariantProps
	variantMap: RadiomarkVariantMap
	variantKeys: Array<keyof RadiomarkVariant>
	getVariantProps: (props?: RadiomarkVariantProps) => RadiomarkVariantProps

	(props?: RadiomarkVariantProps): string

	splitVariantProps<Props extends RadiomarkVariantProps>(
		props: Props,
	): [
		RadiomarkVariantProps,
		Pretty<DistributiveOmit<Props, keyof RadiomarkVariantProps>>,
	]
}

export declare const radiomark: RadiomarkRecipe
