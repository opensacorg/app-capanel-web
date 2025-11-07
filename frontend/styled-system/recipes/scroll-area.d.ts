/* eslint-disable */
import type { ConditionalValue } from '../types/index'
import type { DistributiveOmit, Pretty } from '../types/system-types'

interface ScrollAreaVariant {
	/**
	 * @default "hover"
	 */
	variant: 'hover' | 'always'
	/**
	 * @default "md"
	 */
	size: 'xs' | 'sm' | 'md' | 'lg'
}

type ScrollAreaVariantMap = {
	[key in keyof ScrollAreaVariant]: Array<ScrollAreaVariant[key]>
}

type ScrollAreaSlot =
	| 'root'
	| 'viewport'
	| 'content'
	| 'scrollbar'
	| 'thumb'
	| 'corner'

export type ScrollAreaVariantProps = {
	[key in keyof ScrollAreaVariant]?:
	| ConditionalValue<ScrollAreaVariant[key]>
	| undefined
}

export interface ScrollAreaRecipe {
	__slot: ScrollAreaSlot
	__type: ScrollAreaVariantProps
	raw: (props?: ScrollAreaVariantProps) => ScrollAreaVariantProps
	variantMap: ScrollAreaVariantMap
	variantKeys: Array<keyof ScrollAreaVariant>
	getVariantProps: (props?: ScrollAreaVariantProps) => ScrollAreaVariantProps

	(props?: ScrollAreaVariantProps): Pretty<Record<ScrollAreaSlot, string>>

	splitVariantProps<Props extends ScrollAreaVariantProps>(
		props: Props,
	): [
		ScrollAreaVariantProps,
		Pretty<DistributiveOmit<Props, keyof ScrollAreaVariantProps>>,
	]
}

export declare const scrollArea: ScrollAreaRecipe
