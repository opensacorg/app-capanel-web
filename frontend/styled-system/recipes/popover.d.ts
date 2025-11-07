/* eslint-disable */
import type { ConditionalValue } from '../types/index'
import type { DistributiveOmit, Pretty } from '../types/system-types'

interface PopoverVariant {
	/**
	 * @default "md"
	 */
	size: 'xs' | 'sm' | 'md' | 'lg'
}

type PopoverVariantMap = {
	[key in keyof PopoverVariant]: Array<PopoverVariant[key]>
}

type PopoverSlot =
	| 'arrow'
	| 'arrowTip'
	| 'anchor'
	| 'trigger'
	| 'indicator'
	| 'positioner'
	| 'content'
	| 'title'
	| 'description'
	| 'closeTrigger'
	| 'header'
	| 'body'
	| 'footer'

export type PopoverVariantProps = {
	[key in keyof PopoverVariant]?:
	| ConditionalValue<PopoverVariant[key]>
	| undefined
}

export interface PopoverRecipe {
	__slot: PopoverSlot
	__type: PopoverVariantProps
	raw: (props?: PopoverVariantProps) => PopoverVariantProps
	variantMap: PopoverVariantMap
	variantKeys: Array<keyof PopoverVariant>
	getVariantProps: (props?: PopoverVariantProps) => PopoverVariantProps

	(props?: PopoverVariantProps): Pretty<Record<PopoverSlot, string>>

	splitVariantProps<Props extends PopoverVariantProps>(
		props: Props,
	): [
		PopoverVariantProps,
		Pretty<DistributiveOmit<Props, keyof PopoverVariantProps>>,
	]
}

export declare const popover: PopoverRecipe
