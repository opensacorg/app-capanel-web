/* eslint-disable */
import type { ConditionalValue } from '../types/index'
import type { DistributiveOmit, Pretty } from '../types/system-types'

interface MenuVariant {
	/**
	 * @default "subtle"
	 */
	variant: 'subtle' | 'solid'
	/**
	 * @default "md"
	 */
	size: 'sm' | 'md'
}

type MenuVariantMap = {
	[key in keyof MenuVariant]: Array<MenuVariant[key]>
}

type MenuSlot =
	| 'arrow'
	| 'arrowTip'
	| 'content'
	| 'contextTrigger'
	| 'indicator'
	| 'item'
	| 'itemGroup'
	| 'itemGroupLabel'
	| 'itemIndicator'
	| 'itemText'
	| 'positioner'
	| 'separator'
	| 'trigger'
	| 'triggerItem'
	| 'itemCommand'

export type MenuVariantProps = {
	[key in keyof MenuVariant]?: ConditionalValue<MenuVariant[key]> | undefined
}

export interface MenuRecipe {
	__slot: MenuSlot
	__type: MenuVariantProps
	raw: (props?: MenuVariantProps) => MenuVariantProps
	variantMap: MenuVariantMap
	variantKeys: Array<keyof MenuVariant>
	getVariantProps: (props?: MenuVariantProps) => MenuVariantProps

	(props?: MenuVariantProps): Pretty<Record<MenuSlot, string>>

	splitVariantProps<Props extends MenuVariantProps>(
		props: Props,
	): [MenuVariantProps, Pretty<DistributiveOmit<Props, keyof MenuVariantProps>>]
}

export declare const menu: MenuRecipe
