/* eslint-disable */
import type { ConditionalValue } from '../types/index'
import type { DistributiveOmit, Pretty } from '../types/system-types'

interface CheckmarkVariant {
	/**
	 * @default "md"
	 */
	size: 'xs' | 'sm' | 'md' | 'lg'
	/**
	 * @default "solid"
	 */
	variant: 'solid' | 'outline' | 'subtle' | 'plain' | 'inverted'
}

type CheckmarkVariantMap = {
	[key in keyof CheckmarkVariant]: Array<CheckmarkVariant[key]>
}

export type CheckmarkVariantProps = {
	[key in keyof CheckmarkVariant]?:
	| ConditionalValue<CheckmarkVariant[key]>
	| undefined
}

export interface CheckmarkRecipe {
	__type: CheckmarkVariantProps
	raw: (props?: CheckmarkVariantProps) => CheckmarkVariantProps
	variantMap: CheckmarkVariantMap
	variantKeys: Array<keyof CheckmarkVariant>
	getVariantProps: (props?: CheckmarkVariantProps) => CheckmarkVariantProps

	(props?: CheckmarkVariantProps): string

	splitVariantProps<Props extends CheckmarkVariantProps>(
		props: Props,
	): [
		CheckmarkVariantProps,
		Pretty<DistributiveOmit<Props, keyof CheckmarkVariantProps>>,
	]
}

export declare const checkmark: CheckmarkRecipe
