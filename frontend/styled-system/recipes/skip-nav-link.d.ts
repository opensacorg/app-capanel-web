/* eslint-disable */
import type { ConditionalValue } from '../types/index'
import type { DistributiveOmit, Pretty } from '../types/system-types'

type SkipNavLinkVariant = {}

type SkipNavLinkVariantMap = {
	[key in keyof SkipNavLinkVariant]: Array<SkipNavLinkVariant[key]>
}

export type SkipNavLinkVariantProps = {
	[key in keyof SkipNavLinkVariant]?:
	| ConditionalValue<SkipNavLinkVariant[key]>
	| undefined
}

export interface SkipNavLinkRecipe {
	__type: SkipNavLinkVariantProps
	raw: (props?: SkipNavLinkVariantProps) => SkipNavLinkVariantProps
	variantMap: SkipNavLinkVariantMap
	variantKeys: Array<keyof SkipNavLinkVariant>
	getVariantProps: (props?: SkipNavLinkVariantProps) => SkipNavLinkVariantProps

	(props?: SkipNavLinkVariantProps): string

	splitVariantProps<Props extends SkipNavLinkVariantProps>(
		props: Props,
	): [
		SkipNavLinkVariantProps,
		Pretty<DistributiveOmit<Props, keyof SkipNavLinkVariantProps>>,
	]
}

export declare const skipNavLink: SkipNavLinkRecipe
