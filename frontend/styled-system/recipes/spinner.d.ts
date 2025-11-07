/* eslint-disable */
import type { ConditionalValue } from '../types/index'
import type { DistributiveOmit, Pretty } from '../types/system-types'

interface SpinnerVariant {
	/**
	 * @default "md"
	 */
	size: 'inherit' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'
}

type SpinnerVariantMap = {
	[key in keyof SpinnerVariant]: Array<SpinnerVariant[key]>
}

export type SpinnerVariantProps = {
	[key in keyof SpinnerVariant]?:
	| ConditionalValue<SpinnerVariant[key]>
	| undefined
}

export interface SpinnerRecipe {
	__type: SpinnerVariantProps
	raw: (props?: SpinnerVariantProps) => SpinnerVariantProps
	variantMap: SpinnerVariantMap
	variantKeys: Array<keyof SpinnerVariant>
	getVariantProps: (props?: SpinnerVariantProps) => SpinnerVariantProps

	(props?: SpinnerVariantProps): string

	splitVariantProps<Props extends SpinnerVariantProps>(
		props: Props,
	): [
		SpinnerVariantProps,
		Pretty<DistributiveOmit<Props, keyof SpinnerVariantProps>>,
	]
}

export declare const spinner: SpinnerRecipe
