/* eslint-disable */
import type { ConditionalValue } from '../types/index'
import type { DistributiveOmit, Pretty } from '../types/system-types'

interface HoverCardVariant {
	/**
	 * @default "md"
	 */
	size: 'xs' | 'sm' | 'md' | 'lg'
}

type HoverCardVariantMap = {
	[key in keyof HoverCardVariant]: Array<HoverCardVariant[key]>
}

type HoverCardSlot = 'arrow' | 'arrowTip' | 'trigger' | 'positioner' | 'content'

export type HoverCardVariantProps = {
	[key in keyof HoverCardVariant]?:
	| ConditionalValue<HoverCardVariant[key]>
	| undefined
}

export interface HoverCardRecipe {
	__slot: HoverCardSlot
	__type: HoverCardVariantProps
	raw: (props?: HoverCardVariantProps) => HoverCardVariantProps
	variantMap: HoverCardVariantMap
	variantKeys: Array<keyof HoverCardVariant>
	getVariantProps: (props?: HoverCardVariantProps) => HoverCardVariantProps

	(props?: HoverCardVariantProps): Pretty<Record<HoverCardSlot, string>>

	splitVariantProps<Props extends HoverCardVariantProps>(
		props: Props,
	): [
		HoverCardVariantProps,
		Pretty<DistributiveOmit<Props, keyof HoverCardVariantProps>>,
	]
}

export declare const hoverCard: HoverCardRecipe
