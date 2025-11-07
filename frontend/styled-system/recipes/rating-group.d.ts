/* eslint-disable */
import type { ConditionalValue } from '../types/index'
import type { DistributiveOmit, Pretty } from '../types/system-types'

interface RatingGroupVariant {
	/**
	 * @default "md"
	 */
	size: 'xs' | 'sm' | 'md' | 'lg'
}

type RatingGroupVariantMap = {
	[key in keyof RatingGroupVariant]: Array<RatingGroupVariant[key]>
}

type RatingGroupSlot = 'root' | 'label' | 'item' | 'control' | 'itemIndicator'

export type RatingGroupVariantProps = {
	[key in keyof RatingGroupVariant]?:
	| ConditionalValue<RatingGroupVariant[key]>
	| undefined
}

export interface RatingGroupRecipe {
	__slot: RatingGroupSlot
	__type: RatingGroupVariantProps
	raw: (props?: RatingGroupVariantProps) => RatingGroupVariantProps
	variantMap: RatingGroupVariantMap
	variantKeys: Array<keyof RatingGroupVariant>
	getVariantProps: (props?: RatingGroupVariantProps) => RatingGroupVariantProps

	(props?: RatingGroupVariantProps): Pretty<Record<RatingGroupSlot, string>>

	splitVariantProps<Props extends RatingGroupVariantProps>(
		props: Props,
	): [
		RatingGroupVariantProps,
		Pretty<DistributiveOmit<Props, keyof RatingGroupVariantProps>>,
	]
}

export declare const ratingGroup: RatingGroupRecipe
